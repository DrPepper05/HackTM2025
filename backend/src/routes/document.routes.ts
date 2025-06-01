// backend/src/routes/document.routes.ts
import { Router } from 'express';
import { documentController } from '../controllers';
import {
  authenticateToken,
  requireStaff, // Ensure this is imported
  validateUUID,
  // Potentially add validateDocumentUpload if you have specific validation rules for creation metadata
} from '../middleware';

const router = Router();

// Public routes (no authentication required)
// router.get('/statistics/count', documentController.getDocumentCount);

// All document routes require authentication
router.use(authenticateToken);

// Document CRUD operations
// ADD THIS LINE FOR CREATING DOCUMENTS:
router.post('/', requireStaff, documentController.createDocument); // This will use the multer setup in documentController

router.get('/', documentController.getDocuments);
router.get('/:id', validateUUID('id'), documentController.getDocument);
router.put('/:id', validateUUID('id'), requireStaff, documentController.updateDocument);

// Document processing
router.post('/:documentId/enrich', validateUUID('documentId'), requireStaff, documentController.processEnrichment);
router.post('/:documentId/redact', validateUUID('documentId'), requireStaff, documentController.generateRedacted);
router.post('/:documentId/lifecycle', validateUUID('documentId'), requireStaff, documentController.scheduleLifecycleAction);

export default router;