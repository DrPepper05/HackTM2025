const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase-client');

router.get('/test-supabase', async (req, res) => {
    const {data, error} = await supabase.from('documents').select('*').limit(1);

    if (error) {
        console.error('❌ Supabase Error:', error);
        return res.status(500).json({
            error: 'Supabase connection failed',
            details: error.message || error
        });
    }

    res.json({message: '✅ Supabase connection successful', sample: data});
});

module.exports = router;
