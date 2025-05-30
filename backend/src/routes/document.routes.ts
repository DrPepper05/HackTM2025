import { Router } from 'express'
import { documentController } from '../controllers'
import {
  authenticateToken,
  requireStaff,
  validateUUID
} from '../middleware'

const router = Router()

// All document routes require authentication
router.use(authenticateToken)

// Document CRUD operations
router.get('/', documentController.getDocuments)
router.get('/:id', validateUUID('id'), documentController.getDocument)
router.put('/:id', validateUUID('id'), requireStaff, documentController.updateDocument)

// Document processing
router.post('/:documentId/enrich', validateUUID('documentId'), requireStaff, documentController.processEnrichment)
router.post('/:documentId/redact', validateUUID('documentId'), requireStaff, documentController.generateRedacted)
router.post('/:documentId/lifecycle', validateUUID('documentId'), requireStaff, documentController.scheduleLifecycleAction)

// Statistics
router.get('/stats/overview', requireStaff, documentController.getStatistics)

export default router 