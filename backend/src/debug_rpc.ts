// debug_rpc.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from your .env file
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or Service Role Key is not defined. Make sure .env is configured.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testQueueTask() {
    const documentId = 'debug-doc-id-12345'; // A dummy ID for testing

    console.log("--- 1. Replicating the failing call (3 arguments) ---");
    const params_fail = {
        p_task_type: 'DOCUMENT_ENRICHMENT',
        p_payload: { document_id: documentId },
        p_priority: 7
    };

    try {
        const { data, error } = await supabaseAdmin.rpc('queue_task', params_fail);
        if (error) {
            console.error("✅ CORRECTLY FAILED: The RPC call failed as expected.");
            console.error("   Error Message:", error.message);
        } else {
            console.log("❌ UNEXPECTED SUCCESS: The RPC call with 3 arguments succeeded. Data:", data);
        }
    } catch (e: any) {
        console.error("✅ CORRECTLY FAILED: Caught exception.", e.message);
    }

    console.log("\n" + "=".repeat(60) + "\n");

    console.log("--- 2. Testing the proposed fix (4 arguments) ---");
    const params_fix = {
        p_task_type: 'DOCUMENT_ENRICHMENT',
        p_payload: { document_id: documentId },
        p_priority: 7,
        p_scheduled_for: new Date().toISOString()
    };

    try {
        const { data, error } = await supabaseAdmin.rpc('queue_task', params_fix);
        if (error) {
            console.error("❌ UNEXPECTED FAILURE: The RPC call with 4 arguments failed.");
            console.error("   Error Message:", error.message);
        } else {
            console.log("✅ SUCCESS: The RPC call succeeded! Returned Task ID:", data);
        }
    } catch (e: any) {
        console.error("❌ UNEXPECTED FAILURE: Caught exception.", e.message);
    }
}

testQueueTask();