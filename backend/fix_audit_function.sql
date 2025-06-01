-- Fix the audit log function to use proper SHA256 hashing
-- Run this in your Supabase SQL editor

-- Replace the old create_audit_log function with the correct version
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
    
    -- If no previous hash, use empty string
    IF v_previous_hash IS NULL THEN
        v_previous_hash := '';
    END IF;
    
    -- Generate new UUID for this record
    v_new_id := gen_random_uuid();
    
    -- Create content string for hashing
    v_current_content := CONCAT(
        v_new_id::text, '|',
        p_action, '|',
        p_entity_type, '|',
        COALESCE(p_entity_id::text, ''), '|',
        COALESCE(v_user_id::text, ''), '|',
        COALESCE(v_user_email, ''), '|',
        NOW()::text, '|',
        p_details::text, '|',
        v_previous_hash
    );
    
    -- Generate SHA256 hash
    v_new_hash := encode(digest(v_current_content, 'sha256'), 'hex');
    
    -- Insert the audit log record
    INSERT INTO audit_logs (
        id,
        action,
        entity_type,
        entity_id,
        user_id,
        user_email,
        timestamp,
        details,
        hash
    ) VALUES (
        v_new_id,
        p_action,
        p_entity_type,
        p_entity_id,
        v_user_id,
        v_user_email,
        NOW(),
        p_details,
        v_new_hash
    );
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT create_audit_log(
    'TEST_UPLOAD', 
    'document', 
    gen_random_uuid(), 
    '{"test": "data"}'::jsonb
);

-- Check if the test audit log was created with proper hash
SELECT action, hash, LENGTH(hash) as hash_length 
FROM audit_logs 
WHERE action = 'TEST_UPLOAD' 
ORDER BY timestamp DESC 
LIMIT 1; 