import { Router } from 'express';
import { publicController } from '../controllers/public.controller';

const router = Router();

// Public document statistics
router.get('/documents/count', publicController.getPublicDocumentCount);

export default router; 