-- Fix RLS policy violation for queue_document_enrichment trigger
-- Make the trigger function run with elevated privileges

-- Fix the trigger function to run with SECURITY DEFINER
CREATE OR REPLACE FUNCTION queue_document_enrichment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'INGESTING' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM queue_task(
            'DOCUMENT_ENRICHMENT',                      -- p_task_type (text)
            jsonb_build_object(                         -- p_payload (jsonb)
                'document_id', NEW.id,
                'file_count', (SELECT COUNT(*) FROM document_files WHERE document_id = NEW.id)
            ),
            7,                                          -- p_priority (integer)  
            NOW()                                       -- p_scheduled_for (timestamp)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ADDED: This allows it to bypass RLS

-- Also fix the queue_task function to ensure it can insert into processing_queue
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
        jsonb_build_object('task_type', p_task_type)
    );
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ADDED: This allows it to bypass RLS

-- Test the fix
SELECT 'Trigger and queue_task functions updated with SECURITY DEFINER!' as status; 