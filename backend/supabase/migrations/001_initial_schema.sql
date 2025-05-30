-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create custom enum types for document lifecycle
CREATE TYPE document_status AS ENUM (
  'INGESTING',      -- Document just uploaded, processing started
  'REGISTERED',     -- Document processed, metadata extracted
  'ACTIVE_STORAGE', -- Document in active use
  'REVIEW',         -- Document under retention review
  'DESTROY',        -- Marked for destruction
  'AWAITING_TRANSFER', -- Ready for archive transfer
  'TRANSFERRED'     -- Sent to National Archives
);

CREATE TYPE retention_category AS ENUM (
  '10y',      -- 10 year retention
  '30y',      -- 30 year retention
  'permanent' -- Permanent retention
);

CREATE TYPE file_type AS ENUM (
  'original',   -- Original uploaded file
  'redacted',   -- Redacted version (PII removed)
  'ocr_text',   -- Extracted text
  'transfer'    -- Archive transfer format (EAD/BagIt)
);

CREATE TYPE access_request_status AS ENUM (
  'pending',
  'approved', 
  'rejected'
);

CREATE TYPE user_role AS ENUM (
  'clerk',      -- Can upload and register documents
  'archivist',  -- Can manage document lifecycle
  'citizen',    -- Public access only
  'media',      -- Media access (similar to citizen)
  'inspector',  -- Can view audit logs
  'admin'       -- System administrator
);

-- User profiles extending Supabase auth
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    institution TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic metadata
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT, -- Contract, Decision, Report, etc.
    document_number TEXT, -- Official document number if any
    
    -- Creator information
    creator_info JSONB DEFAULT '{}', -- Flexible field for creator details
    creation_date DATE,
    
    -- Lifecycle management
    status document_status DEFAULT 'INGESTING',
    retention_category retention_category,
    retention_end_date DATE, -- Calculated based on category
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    release_date DATE, -- When document becomes public
    confidentiality_note TEXT,
    
    -- Upload tracking
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    uploader_user_id UUID REFERENCES auth.users(id),
    
    -- AI/ML suggestions (will be populated by enrichment)
    ai_suggested_title TEXT,
    ai_predicted_retention retention_category,
    ai_detected_pii JSONB DEFAULT '[]', -- Array of detected PII types
    
    -- Search and metadata
    metadata JSONB DEFAULT '{}', -- Flexible additional metadata
    tags TEXT[] DEFAULT '{}',
    search_vector tsvector, -- For full-text search
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document files tracking (actual files will be in S3)
CREATE TABLE document_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- File identification
    file_type file_type NOT NULL DEFAULT 'original',
    file_name TEXT NOT NULL,
    
    -- S3 storage reference (prepared for future S3 integration)
    storage_bucket TEXT DEFAULT 'openarchive-documents',
    storage_key TEXT NOT NULL, -- S3 object key
    storage_region TEXT DEFAULT 'eu-central-1',
    
    -- File metadata
    mime_type TEXT,
    file_size BIGINT,
    checksum TEXT NOT NULL,
    checksum_algorithm TEXT DEFAULT 'SHA-256',
    
    -- OCR/Processing results
    ocr_text TEXT, -- Extracted text content
    ocr_confidence FLOAT,
    processing_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event information
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT, -- Denormalized for history
    action TEXT NOT NULL, -- DOCUMENT_UPLOADED, STATUS_CHANGED, etc.
    
    -- Target entity
    entity_type TEXT NOT NULL, -- document, user, system
    entity_id UUID,
    
    -- Event details
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Blockchain-like integrity
    hash TEXT NOT NULL, -- Hash of current record
    previous_hash TEXT, -- Hash of previous record
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access requests from citizens/media
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Requester information
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    requester_id_number TEXT, -- National ID for verification
    requester_organization TEXT,
    
    -- Request details
    document_id UUID REFERENCES documents(id),
    justification TEXT NOT NULL,
    intended_use TEXT,
    
    -- Processing
    status access_request_status DEFAULT 'pending',
    processed_by_user_id UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task queue for async processing
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Task definition
    task_type TEXT NOT NULL, -- ENRICHMENT, OCR, REDACTION, etc.
    priority INTEGER DEFAULT 5, -- 1-10, higher is more important
    
    -- Task data
    payload JSONB NOT NULL,
    
    -- Execution control
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error tracking
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create all necessary indexes for performance
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_public ON documents(is_public) WHERE is_public = true;
CREATE INDEX idx_documents_retention ON documents(retention_category, retention_end_date);
CREATE INDEX idx_documents_uploader ON documents(uploader_user_id);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_metadata ON documents USING GIN(metadata);

CREATE INDEX idx_files_document ON document_files(document_id);
CREATE INDEX idx_files_type ON document_files(file_type);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

CREATE INDEX idx_requests_status ON access_requests(status);
CREATE INDEX idx_requests_document ON access_requests(document_id);

CREATE INDEX idx_queue_status ON processing_queue(status, scheduled_for) 
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_queue_type ON processing_queue(task_type);