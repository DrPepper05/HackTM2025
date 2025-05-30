const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const verifyToken = require('../services/auth');

router.get('/', verifyToken, async (req, res) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('uploader_id', req.user.sub); // Supabase user ID

    if (error) return res.status(500).json({ error });
    res.json(data);
});

module.exports = router;
