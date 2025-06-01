import { Router } from 'express';
import { publicController } from '../controllers/public.controller';

const router = Router();

// Public document statistics
router.get('/documents/count', publicController.getPublicDocumentCount);

// Public document download
router.get('/documents/:documentId/download', publicController.downloadPublicDocument);

export { router as publicRoutes }; 