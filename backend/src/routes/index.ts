// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import searchRoutes from './search.routes';
import adminRoutes from './admin.routes';
import accessRequestRoutes from './access-request.routes'; // Import the new routes

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/access-requests', accessRequestRoutes); // Mount the new access request routes

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OpenArchive API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;