require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔌 Add your route
const documentRoutes = require('./routes/documents');
app.use('/documents', documentRoutes);  // <-- register it here

const adminRoutes = require('./routes/admin/admin');
app.use('/admin', adminRoutes);


const adminSettingsRoutes = require('./routes/admin/settings');
app.use('/admin/settings', adminSettingsRoutes);


// Health check
app.get('/', (req, res) => {
    res.send({ message: '🚀 OpenArchive backend is live!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT}`);
});
