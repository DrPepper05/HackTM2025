const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    try {
        const decoded = jwt.decode(token); // You can verify with Supabase's JWT secret too
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
}

module.exports = verifyToken;
