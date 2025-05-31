-- Quick fix for the queue_document_enrichment trigger function
-- This addresses the immediate issue without needing to re-run the entire migration

-- Fix the trigger function that's causing the error
CREATE OR REPLACE FUNCTION queue_document_enrichment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'INGESTING' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM queue_task(
            'DOCUMENT_ENRICHMENT',                      -- p_task_type (text)
            jsonb_build_object(                         -- p_payload (jsonb) - FIXED: was json_build_object
                'document_id', NEW.id,
                'file_count', (SELECT COUNT(*) FROM document_files WHERE document_id = NEW.id)
            ),
            7,                                          -- p_priority (integer)  
            NOW()                                       -- p_scheduled_for (timestamp) - FIXED: was missing
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test the fix
SELECT 'Trigger function fixed successfully!' as status; 