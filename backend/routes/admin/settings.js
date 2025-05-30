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
    const { key } = req.params;
    const { value } = req.body;

    const { data, error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select();

    if (error) return res.status(500).json({ error: 'Failed to update setting', details: error });
    res.json(data[0]);
});

module.exports = router;
