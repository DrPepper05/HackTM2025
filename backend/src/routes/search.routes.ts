import { Router } from 'express'
import { searchController } from '../controllers'
import {
  authenticateToken,
  authenticateOptionalToken,
  requireStaff,
  requireAdmin,
  validateSearch,
  validateUUID
} from '../middleware'

const router = Router()

// Public search routes (no authentication required)
router.get('/public', validateSearch, searchController.publicSearch)
router.get('/suggestions', searchController.getSearchSuggestions)

// Staff search routes (authentication required)
router.use(authenticateToken)

router.post('/documents', requireStaff, searchController.searchDocuments)
router.post('/advanced', requireStaff, searchController.advancedSearch)
router.get('/content', requireStaff, searchController.searchDocumentContent)
router.get('/similar/:documentId', requireStaff, validateUUID('documentId'), searchController.findSimilar)
router.post('/export', requireStaff, searchController.exportResults)

// Admin only routes
router.get('/analytics', requireAdmin, searchController.getSearchAnalytics)

export default router 