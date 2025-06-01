import { Router } from 'express'
import { inspectorController } from '../controllers'
import { authenticateToken, requireRoles } from '../middleware/auth.middleware'

const router = Router()

// All inspector routes require authentication and inspector/admin role
router.use(authenticateToken)
router.use(requireRoles(['inspector', 'admin']))

// Audit log routes
router.get('/audit-logs', inspectorController.getAuditLogs)
router.get('/audit-logs/export', inspectorController.exportAuditLogs)
router.get('/audit-logs/statistics', inspectorController.getAuditStatistics)
router.get('/audit-logs/integrity-check', inspectorController.verifyIntegrity)
router.get('/audit-logs/compliance-report', inspectorController.getComplianceReport)
router.get('/audit-logs/user/:userId', inspectorController.getUserAuditTrail)
router.get('/audit-logs/entity/:entityType/:entityId', inspectorController.getEntityAuditTrail)
router.get('/audit-logs/search', inspectorController.searchAuditLogs)
router.get('/audit-logs/critical-events', inspectorController.getCriticalEvents)

export default router 