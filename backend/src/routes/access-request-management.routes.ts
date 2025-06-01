import { Router } from 'express'
import { adminController } from '../controllers'
import {
  authenticateToken,
  requireAccessProcessor,
  validateUUID
} from '../middleware'

const router = Router()

// All access request management routes require authentication and archivist/admin role
router.use(authenticateToken, requireAccessProcessor)

// Get all access requests with filtering (for archivists and admins)
router.get('/', adminController.getAccessRequests)

// Update access request status (approve/reject)
router.put('/:id', validateUUID('id'), adminController.updateAccessRequest)

// Get access request statistics
router.get('/stats', adminController.getAccessRequestStats)

// Bulk process access requests
router.post('/bulk', adminController.bulkProcessAccessRequests)

export default router 