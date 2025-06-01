import { Router } from 'express'
import { adminController } from '../controllers'
import {
  authenticateToken,
  requireAdmin,
  validateUUID
} from '../middleware'

const router = Router()

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin)

// Dashboard and overview
router.get('/dashboard', adminController.getDashboard)
router.get('/health', adminController.getSystemHealth)

// Queue management
router.get('/queue', adminController.getQueueStatus)
router.post('/queue/tasks/:taskId/retry', validateUUID('taskId'), adminController.retryTask)
router.post('/queue/cleanup', adminController.cleanupTasks)

// Lifecycle management
router.get('/lifecycle', adminController.checkLifecycles)
router.post('/lifecycle/review', adminController.markForReview)

// Storage management
router.get('/storage', adminController.getStorageStats)
router.post('/storage/cleanup', adminController.cleanupTempFiles)

// Audit and export
router.post('/audit/export', adminController.exportAuditLogs)

export default router 