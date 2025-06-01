/**
 * Main application entry point
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import documentRoutes from './routes/documents';

// Load environment variables
dotenv.config();

// Create upload directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIRECTORY || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/documents', documentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
// app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error('Unhandled error:', err);
  
//   // Handle multer errors
//   if (err.name === 'MulterError') {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ 
//         error: `File too large. Maximum size is ${parseInt(process.env.MAX_FILE_SIZE || '10485760') / (1024 * 1024)}MB` 
//       });
//     }
//     return res.status(400).json({ error: err.message });
//   }
  
//   res.status(500).json({ error: 'Internal server error' });
// });

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;