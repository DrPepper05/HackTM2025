-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE
OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
BEGIN
RETURN COALESCE(
        (SELECT role
         FROM user_profiles
         WHERE id = auth.uid()),
        'citizen' ::user_role
       );
END;
$$
LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user has any of the specified roles
CREATE
OR REPLACE FUNCTION auth.has_any_role(roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
RETURN auth.user_role() = ANY (roles);
END;
$$
LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- USER PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE
POLICY "Users can view own profile"
    ON user_profiles FOR
SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE
POLICY "Users can update own profile"
    ON user_profiles FOR
UPDATE
    USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    );

-- Admins can view all profiles
CREATE
POLICY "Admins can view all profiles"
    ON user_profiles FOR
SELECT
    USING (auth.has_any_role(ARRAY['admin']::user_role[]));

-- Admins can manage all profiles
CREATE
POLICY "Admins can manage profiles"
    ON user_profiles FOR ALL
    USING (auth.has_any_role(ARRAY['admin']::user_role[]));

-- ============================================
-- DOCUMENTS POLICIES
-- ============================================

-- Public documents are viewable by everyone (even anonymous)
CREATE
POLICY "Public documents are viewable by all"
    ON documents FOR
SELECT
    USING (
    is_public = true
    AND (release_date IS NULL OR release_date <= CURRENT_DATE)
    );

-- Staff (clerk, archivist, inspector, admin) can view all documents
CREATE
POLICY "Staff can view all documents"
    ON documents FOR
SELECT
    USING (
    auth.has_any_role(ARRAY['clerk', 'archivist', 'inspector', 'admin']::user_role[])
    );

-- Clerks and archivists can create documents
CREATE
POLICY "Clerks can create documents"
    ON documents FOR INSERT
    WITH CHECK (
        auth.has_any_role(ARRAY['clerk', 'archivist', 'admin']::user_role[])
        AND auth.uid() = uploader_user_id
    );

-- Only archivists and admins can update documents
CREATE
POLICY "Archivists can update documents"
    ON documents FOR
UPDATE
    USING (
    auth.has_any_role(ARRAY['archivist', 'admin']::user_role[])
    )
WITH CHECK (
    auth.has_any_role(ARRAY['archivist', 'admin']::user_role[])
    );

-- Only admins can delete documents (soft delete preferred in production)
CREATE
POLICY "Only admins can delete documents"
    ON documents FOR DELETE
USING (auth.has_any_role(ARRAY['admin']::user_role[]));

-- ============================================
-- DOCUMENT FILES POLICIES
-- ============================================

-- Files follow document visibility
CREATE
POLICY "Files inherit document visibility"
    ON document_files FOR
SELECT
    USING (
    EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_files.document_id
    AND (
    -- Public document
    (d.is_public = true AND (d.release_date IS NULL OR d.release_date <= CURRENT_DATE))
    -- Or user is staff
    OR auth.has_any_role(ARRAY['clerk', 'archivist', 'inspector', 'admin']::user_role[])
    )
    )
    );

-- Staff can create document files
CREATE
POLICY "Staff can create document files"
    ON document_files FOR INSERT
    WITH CHECK (
        auth.has_any_role(ARRAY['clerk', 'archivist', 'admin']::user_role[])
        AND EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_files.document_id
        )
    );

-- Archivists and admins can update files
CREATE
POLICY "Archivists can update files"
    ON document_files FOR
UPDATE
    USING (auth.has_any_role(ARRAY['archivist', 'admin']::user_role[]));

-- Only admins can delete files
CREATE
POLICY "Only admins can delete files"
    ON document_files FOR DELETE
USING (auth.has_any_role(ARRAY['admin']::user_role[]));

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Audit logs are append-only for everyone
CREATE
POLICY "Anyone can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- Only inspectors and admins can read audit logs
CREATE
POLICY "Inspectors can read audit logs"
    ON audit_logs FOR
SELECT
    USING (
    auth.has_any_role(ARRAY['inspector', 'admin']::user_role[])
    );

-- No one can update audit logs (immutable)
-- No policy = no access

-- No one can delete audit logs (immutable)
-- No policy = no access

-- ============================================
-- ACCESS REQUESTS POLICIES
-- ============================================

-- Anyone can create an access request
CREATE
POLICY "Anyone can request document access"
    ON access_requests FOR INSERT
    WITH CHECK (true);

-- Requesters can view their own requests
CREATE
POLICY "Users can view own access requests"
    ON access_requests FOR
SELECT
    USING (
    requester_email = (SELECT email FROM user_profiles WHERE id = auth.uid())
    );

-- Staff can view all access requests
CREATE
POLICY "Staff can view all access requests"
    ON access_requests FOR
SELECT
    USING (
    auth.has_any_role(ARRAY['clerk', 'archivist', 'inspector', 'admin']::user_role[])
    );

-- Archivists and admins can process requests
CREATE
POLICY "Archivists can process access requests"
    ON access_requests FOR
UPDATE
    USING (
    auth.has_any_role(ARRAY['archivist', 'admin']::user_role[])
    AND status = 'pending'
    )
WITH CHECK (
    auth.has_any_role(ARRAY['archivist', 'admin']::user_role[])
    AND processed_by_user_id = auth.uid()
    AND processed_at IS NOT NULL
    );

-- ============================================
-- PROCESSING QUEUE POLICIES
-- ============================================

-- System/service role can manage queue (for backend workers)
CREATE
POLICY "Service role can manage queue"
    ON processing_queue FOR ALL
    USING (
        auth.role() = 'service_role'
        OR auth.has_any_role(ARRAY['admin']::user_role[])
    );

-- Staff can view queue status
CREATE
POLICY "Staff can view queue"
    ON processing_queue FOR
SELECT
    USING (
    auth.has_any_role(ARRAY['clerk', 'archivist', 'inspector', 'admin']::user_role[])
    );

-- ============================================
-- STORAGE POLICIES (via SQL for reference)
-- ============================================

-- Note: These would typically be set up in Supabase Dashboard
-- or via the Storage API, but documenting the intent here

-- storage.objects policies for 'documents' bucket:
-- 1. Staff can upload to documents bucket
-- 2. Public can view files linked to public documents
-- 3. Staff can view all files

-- storage.objects policies for 'public-documents' bucket:
-- 1. Anyone can view (truly public bucket)
-- 2. Only archivists can upload/modify

-- ============================================
-- SPECIAL POLICIES FOR CITIZEN ACCESS
-- ============================================

-- Citizens can view their submitted access requests
CREATE
POLICY "Citizens view own submissions"
    ON documents FOR
SELECT
    USING (
    EXISTS (
    SELECT 1 FROM access_requests ar
    WHERE ar.document_id = documents.id
    AND ar.requester_email = (SELECT email FROM user_profiles WHERE id = auth.uid())
    AND ar.status = 'approved'
    )
    );

-- Function to check document access with logging
CREATE
OR REPLACE FUNCTION check_document_access(p_document_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
v_is_public BOOLEAN;
    v_has_access
BOOLEAN := FALSE;
    v_user_role
user_role;
BEGIN
    -- Get document public status
SELECT is_public
INTO v_is_public
FROM documents
WHERE id = p_document_id;

-- Get user role
v_user_role
:= auth.user_role();
    
    -- Check access
    IF
v_is_public THEN
        v_has_access := TRUE;
    ELSIF
v_user_role IN ('clerk', 'archivist', 'inspector', 'admin') THEN
        v_has_access := TRUE;
    ELSIF
EXISTS (
        SELECT 1 FROM access_requests
        WHERE document_id = p_document_id
        AND requester_email = (SELECT email FROM user_profiles WHERE id = auth.uid())
        AND status = 'approved'
    ) THEN
        v_has_access := TRUE;
END IF;
    
    -- Log access attempt
    PERFORM
public.create_audit_log( -- Always good to specify schema, though 'public' is default search path
    'DOCUMENT_ACCESS_CHECK',
    'document',
    p_document_id,
    json_build_object(
        'access_granted', v_has_access,
        'user_role', v_user_role,
        'is_public_doc', v_is_public
    ),
    p_current_user_id, -- Pass the user ID if available in this context
    v_user_email,      -- Pass user email if available
    v_ip_address,      -- Pass IP address if available
    v_user_agent       -- Pass user agent if available
);

RETURN v_has_access;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;
