const express = require('express');
const router = express.Router();
const supabase = require('../../services/supabase-client');

// GET all settings
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) return res.status(500).json({ error: 'Failed to fetch settings', details: error });

    const result = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
    }, {});
    res.json(result);
});

// PATCH a setting
router.patch('/:key', async (req, res) => {
    const { key: newKey, value, type } = req.body;
    const { key: oldKey } = req.params;

    if (!value || !type) {
        return res.status(400).json({ error: 'Missing value or type' });
    }

    const isRenaming = newKey && newKey !== oldKey;

    if (isRenaming) {
        // 1. Check for key conflict
        const { data: existing } = await supabase
            .from('settings')
            .select('key')
            .eq('key', newKey)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Key already exists' });
        }

        // 2. Insert new setting
        const { error: insertError } = await supabase
            .from('settings')
            .insert([{ key: newKey, value, type }]);

        if (insertError) {
            return res.status(400).json({ error: 'Insert failed', details: insertError });
        }

        // 3. Delete old setting
        const { error: deleteError } = await supabase
            .from('settings')
            .delete()
            .eq('key', oldKey);

        if (deleteError) {
            return res.status(500).json({ error: 'Cleanup failed', details: deleteError });
        }

        return res.json({ key: newKey, value, type });
    }

    // No key change — regular update
    const { data, error } = await supabase
        .from('settings')
        .update({ value, type, updated_at: new Date().toISOString() })
        .eq('key', oldKey)
        .select();

    if (error) {
        return res.status(500).json({ error: 'Update failed', details: error });
    }

    res.json(data[0]);
});


// POST /admin/settings — create new setting
router.post('/', async (req, res) => {
    const { key, value } = req.body;

    const { data, error } = await supabase
        .from('settings')
        .insert([{ key, value }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

// DELETE /admin/settings/:key
router.delete('/:key', async (req, res) => {
    const { key } = req.params;

    const { error } = await supabase
        .from('settings')
        .delete()
        .eq('key', key);

    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send(); // No content
});

module.exports = router;
