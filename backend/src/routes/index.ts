// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import searchRoutes from './search.routes';
import adminRoutes from './admin.routes';
import inspectorRoutes from './inspector.routes';
import accessRequestRoutes from './access-request.routes';
import accessRequestManagementRoutes from './access-request-management.routes';
import userRoutes from './user.routes';
import publicRoutes from './public.routes';

const router = Router();

// Public routes (no authentication required)
router.use('/public', publicRoutes);

// Mount routes
router.use('/auth', authRoutes);
router.use('/search', searchRoutes);

// Protected routes
router.use('/documents', documentRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/access-requests-manage', accessRequestManagementRoutes);

// Role-specific routes
router.use('/admin', adminRoutes);
router.use('/inspector', inspectorRoutes);
router.use('/admin', userRoutes);

export default router;