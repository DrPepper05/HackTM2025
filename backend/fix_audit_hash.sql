-- Fix audit log hash function
-- Run this in your Supabase SQL editor to replace mock hashes with real SHA256 hashing

-- Step 1: Update the create_audit_log function with proper hashing
CREATE OR REPLACE FUNCTION create_audit_log(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_previous_hash TEXT;
    v_current_content TEXT;
    v_new_hash TEXT;
    v_new_id UUID;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    -- Get user email from profile
    SELECT email INTO v_user_email
    FROM user_profiles
    WHERE id = v_user_id;
    
    -- Get the hash of the most recent audit log
    SELECT hash INTO v_previous_hash
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 1;
    
    -- If no previous hash exists (first entry), use a genesis hash
    IF v_previous_hash IS NULL THEN
        v_previous_hash := encode(sha256('GENESIS_BLOCK_OPENARCHIVE'::bytea), 'hex');
    END IF;
    
    -- Construct content to be hashed
    v_current_content := json_build_object(
        'timestamp', NOW(),
        'user_id', v_user_id,
        'user_email', v_user_email,
        'action', p_action,
        'entity_type', p_entity_type,
        'entity_id', p_entity_id,
        'details', p_details,
        'previous_hash', v_previous_hash
    )::TEXT;
    
    -- Generate hash
    v_new_hash := encode(sha256(v_current_content::bytea), 'hex');
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        entity_type,
        entity_id,
        details,
        hash,
        previous_hash,
        ip_address,
        user_agent
    ) VALUES (
        v_user_id,
        v_user_email,
        p_action,
        p_entity_type,
        p_entity_id,
        p_details,
        v_new_hash,
        v_previous_hash,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent'
    )
    RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Clean up existing records with mock hashes
DELETE FROM audit_logs WHERE hash LIKE 'MOCK_HASH_FOR_HACKATHON%';

-- Step 3: Verification message
SELECT 'Audit log function updated! Mock hashes removed. New audit logs will use proper SHA256 hashing.' AS message; 