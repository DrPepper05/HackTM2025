// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import searchRoutes from './search.routes';
import adminRoutes from './admin.routes';
import accessRequestRoutes from './access-request.routes'; // Import the new routes
import inspectorRoutes from './inspector.routes';
import userRoutes from './user.routes';
import publicRoutes from './public.routes';

const router = Router();

// Public routes (no authentication required)
router.use('/public', publicRoutes);

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/access-requests', accessRequestRoutes); // Mount the new access request routes
router.use('/inspector', inspectorRoutes);
router.use('/admin', userRoutes);

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