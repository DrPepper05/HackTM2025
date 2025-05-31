-- Database Reset Script
-- WARNING: This will delete ALL data in your database!
-- Run this in Supabase SQL Editor with caution

-- Step 1: Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS processing_queue CASCADE;
DROP TABLE IF EXISTS document_files CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 2: Drop all custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_document_search_vector() CASCADE;
DROP FUNCTION IF EXISTS calculate_retention_end_date() CASCADE;
DROP FUNCTION IF EXISTS create_audit_log(TEXT, TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS queue_task(TEXT, JSONB, INTEGER, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS queue_task_from_js(TEXT, TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_audit_log_integrity() CASCADE;
DROP FUNCTION IF EXISTS get_pending_tasks(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS transition_document_status(UUID, document_status, TEXT) CASCADE;
DROP FUNCTION IF EXISTS queue_document_enrichment() CASCADE;

-- Step 3: Drop custom types
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS retention_category CASCADE;
DROP TYPE IF EXISTS queue_status CASCADE;

-- Step 4: Drop any remaining indexes or triggers
DROP INDEX IF EXISTS idx_documents_search_vector;
DROP INDEX IF EXISTS idx_documents_status;
DROP INDEX IF EXISTS idx_documents_retention_end_date;
DROP INDEX IF EXISTS idx_processing_queue_status;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;

SELECT 'Database reset complete! Now run your migration files in order:' as status;
SELECT '1. 001_initial_schema.sql' as step_1;
SELECT '2. 002_functions_and_triggers.sql' as step_2;
SELECT '3. 003_row_level_security.sql' as step_3; 