-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update full-text search vector
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('romanian', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('romanian', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('romanian', COALESCE(NEW.ai_suggested_title, '')), 'B') ||
        setweight(to_tsvector('romanian', COALESCE(NEW.document_type, '')), 'C') ||
        setweight(to_tsvector('romanian', COALESCE(NEW.document_number, '')), 'C') ||
        setweight(to_tsvector('romanian', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('romanian', COALESCE(NEW.metadata->>'keywords', '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate retention end date based on category
CREATE OR REPLACE FUNCTION calculate_retention_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.retention_category IS NOT NULL THEN
        CASE NEW.retention_category
            WHEN '10y' THEN
                NEW.retention_end_date := COALESCE(NEW.creation_date, NEW.created_at::date) + INTERVAL '10 years';
            WHEN '30y' THEN
                NEW.retention_end_date := COALESCE(NEW.creation_date, NEW.created_at::date) + INTERVAL '30 years';
            WHEN 'permanent' THEN
                NEW.retention_end_date := NULL; -- No end date for permanent retention
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log with hash chain
-- In your PostgreSQL database (e.g., in setup_database.sql or a new migration)
-- Ensure the uuid-ossp extension is enabled if not already
-- In your setup_database.sql file or a new migration script
-- Ensure the uuid-ossp extension is enabled for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.create_audit_log(
    -- **IMPORTANT: Parameters MUST be in this exact order as per the error message**
    p_action TEXT,
    p_details JSONB,            -- This parameter is now second
    p_entity_id UUID,
    p_entity_type TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_user_email TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL  -- This parameter is now last
)
RETURNS UUID AS $$ -- The function will return the UUID of the newly created audit log
DECLARE
new_log_id UUID;
    computed_hash TEXT;
    last_hash TEXT;
BEGIN
    -- Fetch the hash of the last log entry to maintain the blockchain-like integrity
SELECT hash INTO last_hash
FROM audit_logs
ORDER BY timestamp DESC, created_at DESC
    LIMIT 1;

-- Generate a new UUID for the log entry
new_log_id := uuid_generate_v4();

    -- Insert the new log entry into the audit_logs table
INSERT INTO audit_logs (
    id,
    timestamp,
    user_id,          -- Corresponds to p_user_id (now the last parameter)
    user_email,       -- Corresponds to p_user_email
    action,           -- Corresponds to p_action
    entity_type,      -- Corresponds to p_entity_type
    entity_id,        -- Corresponds to p_entity_id
    details,          -- Corresponds to p_details (now the second parameter)
    ip_address,       -- Corresponds to p_ip_address
    user_agent,       -- Corresponds to p_user_agent
    previous_hash,
    hash,             -- This should be computed based on the final row data for true integrity
    created_at
) VALUES (
             new_log_id,
             NOW(),
             p_user_id,        -- Use the p_user_id parameter
             p_user_email,     -- Use the p_user_email parameter
             p_action,         -- Use the p_action parameter
             p_entity_type,    -- Use the p_entity_type parameter
             p_entity_id,      -- Use the p_entity_id parameter
             p_details,        -- Use the p_details parameter
             p_ip_address,     -- Use the p_ip_address parameter
             p_user_agent,     -- Use the p_user_agent parameter
             last_hash,
             'MOCK_HASH_FOR_HACKATHON_BUT_COMPUTE_THIS_IN_REAL_APP', -- Replace with your actual hash computation logic
             NOW()
         );

RETURN new_log_id; -- Return the ID of the newly created log entry
END;
$$ LANGUAGE plpgsql;

-- Function to queue a processing task
CREATE OR REPLACE FUNCTION queue_task(
    p_task_type TEXT,
    p_payload JSONB,
    p_priority INTEGER DEFAULT 5,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
BEGIN
    INSERT INTO processing_queue (
        task_type,
        payload,
        priority,
        scheduled_for
    ) VALUES (
        p_task_type,
        p_payload,
        p_priority,
        p_scheduled_for
    )
    RETURNING id INTO v_task_id;
    
    -- Log the task creation
    PERFORM create_audit_log(
        'TASK_QUEUED',
        'processing_queue',
        v_task_id,
        json_build_object('task_type', p_task_type)
    );
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_log_integrity()
RETURNS TABLE (
    is_valid BOOLEAN,
    invalid_at_id UUID,
    expected_hash TEXT,
    actual_hash TEXT
) AS $$
DECLARE
    r RECORD;
    v_calculated_hash TEXT;
    v_previous_hash TEXT := encode(sha256('GENESIS_BLOCK_OPENARCHIVE'::bytea), 'hex');
BEGIN
    FOR r IN 
        SELECT * FROM audit_logs ORDER BY timestamp ASC
    LOOP
        -- Calculate what the hash should be
        v_calculated_hash := encode(sha256(
            json_build_object(
                'timestamp', r.timestamp,
                'user_id', r.user_id,
                'user_email', r.user_email,
                'action', r.action,
                'entity_type', r.entity_type,
                'entity_id', r.entity_id,
                'details', r.details,
                'previous_hash', v_previous_hash
            )::TEXT::bytea
        ), 'hex');
        
        -- Check if it matches
        IF v_calculated_hash != r.hash THEN
            RETURN QUERY SELECT 
                FALSE,
                r.id,
                v_calculated_hash,
                r.hash;
            RETURN;
        END IF;
        
        v_previous_hash := r.hash;
    END LOOP;
    
    -- All records are valid
    RETURN QUERY SELECT TRUE, NULL::UUID, NULL::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get next tasks from queue
CREATE OR REPLACE FUNCTION get_pending_tasks(p_limit INTEGER DEFAULT 10)
RETURNS SETOF processing_queue AS $$
BEGIN
    RETURN QUERY
    UPDATE processing_queue
    SET 
        status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id IN (
        SELECT id
        FROM processing_queue
        WHERE status = 'pending'
            AND scheduled_for <= NOW()
            AND attempts < max_attempts
        ORDER BY priority DESC, created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Function to handle document lifecycle transitions
CREATE OR REPLACE FUNCTION transition_document_status(
    p_document_id UUID,
    p_new_status document_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS documents AS $$
DECLARE
    v_document documents;
    v_old_status document_status;
BEGIN
    -- Get current document
    SELECT * INTO v_document
    FROM documents
    WHERE id = p_document_id
    FOR UPDATE;
    
    v_old_status := v_document.status;
    
    -- Validate transition (simplified for hackathon)
    -- In production, would have complex state machine validation
    
    -- Update status
    UPDATE documents
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_document_id
    RETURNING * INTO v_document;
    
    -- Create audit log
    PERFORM create_audit_log(
        'DOCUMENT_STATUS_CHANGED',
        'document',
        p_document_id,
        json_build_object(
            'old_status', v_old_status,
            'new_status', p_new_status,
            'notes', p_notes
        )
    );
    
    -- Queue any follow-up tasks
    CASE p_new_status
        WHEN 'REGISTERED' THEN
            -- Queue for search indexing
            PERFORM queue_task(
                'INDEX_DOCUMENT',
                json_build_object('document_id', p_document_id)
            );
        WHEN 'REVIEW' THEN
            -- Queue for retention review
            PERFORM queue_task(
                'RETENTION_REVIEW',
                json_build_object('document_id', p_document_id),
                8 -- Higher priority
            );
        WHEN 'AWAITING_TRANSFER' THEN
            -- Queue for archive package creation
            PERFORM queue_task(
                'CREATE_ARCHIVE_PACKAGE',
                json_build_object('document_id', p_document_id),
                9 -- High priority
            );
    END CASE;
    
    RETURN v_document;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_requests_updated_at BEFORE UPDATE ON access_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_queue_updated_at BEFORE UPDATE ON processing_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_search_vector BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

CREATE TRIGGER calculate_documents_retention_end_date BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION calculate_retention_end_date();

-- Trigger to automatically queue enrichment when document is uploaded
CREATE OR REPLACE FUNCTION queue_document_enrichment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'INGESTING' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM queue_task(
            'DOCUMENT_ENRICHMENT',
            json_build_object(
                'document_id', NEW.id,
                'file_count', (SELECT COUNT(*) FROM document_files WHERE document_id = NEW.id)
            ),
            7 -- Moderate-high priority
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_enrichment_on_ingest AFTER INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION queue_document_enrichment();
