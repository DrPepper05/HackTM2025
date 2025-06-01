const express = require('express');
const router = express.Router();
const supabase = require('../../services/supabase-client');
const verifyToken = require('../../services/auth'); // optional: use Supabase JWT validation

// ✅ GET: All documents (admin view)
router.get('/documents', async (req, res) => {
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Could not fetch documents', details: error });
    res.json(data);
});

// ✅ PATCH: Approve/reject a document
router.patch('/documents/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // expected: 'approved' | 'rejected'

    const { data, error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: 'Failed to update document', details: error });
    res.json(data[0]);
});

module.exports = router;
