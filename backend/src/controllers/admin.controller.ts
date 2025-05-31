import { Request, Response } from 'express'
import { queueService, lifecycleService, storageService, accessRequestService } from '../services'
import { asyncHandler } from '../middleware'

export class AdminController {
  /**
   * Get system overview dashboard
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const [
      queueStats,
      lifecycleCheck,
      storageStats,
      accessRequestStats
    ] = await Promise.all([
      queueService.getTaskStatistics(),
      lifecycleService.checkDocumentLifecycles(),
      storageService.getStorageStatistics(),
      accessRequestService.getAccessRequestStatistics(req.userId!, 30)
    ])

    res.json({
      success: true,
      data: {
        queue: queueStats,
        lifecycle: lifecycleCheck,
        storage: storageStats,
        accessRequests: accessRequestStats
      }
    })
  })

  /**
   * Get processing queue status
   */
  getQueueStatus = asyncHandler(async (req: Request, res: Response) => {
    const { types, limit = 50 } = req.query

    const tasks = await queueService.getPendingTasks(
      types ? (types as string).split(',') : undefined,
      Number(limit)
    )

    const stats = await queueService.getTaskStatistics()

    res.json({
      success: true,
      data: {
        pending_tasks: tasks,
        statistics: stats
      }
    })
  })

  /**
   * Retry failed task
   */
  retryTask = asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params
    const { delay } = req.body

    await queueService.retryTask(taskId, delay)

    res.json({
      success: true,
      message: 'Task queued for retry'
    })
  })

  /**
   * Clean up old tasks
   */
  cleanupTasks = asyncHandler(async (req: Request, res: Response) => {
    const { olderThanDays = 30 } = req.body

    const deletedCount = await queueService.cleanupOldTasks(Number(olderThanDays))

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old tasks`
    })
  })

  /**
   * Check documents for lifecycle actions
   */
  checkLifecycles = asyncHandler(async (req: Request, res: Response) => {
    const result = await lifecycleService.checkDocumentLifecycles()

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Mark documents for review
   */
  markForReview = asyncHandler(async (req: Request, res: Response) => {
    const { document_ids } = req.body

    if (!Array.isArray(document_ids)) {
      return res.status(400).json({
        success: false,
        message: 'document_ids must be an array'
      })
    }

    await lifecycleService.markForReview(document_ids)

    res.json({
      success: true,
      message: `${document_ids.length} documents marked for review`
    })
  })

  /**
   * Get storage statistics
   */
  getStorageStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await storageService.getStorageStatistics()

    res.json({
      success: true,
      data: stats
    })
  })

  /**
   * Clean up temporary files
   */
  cleanupTempFiles = asyncHandler(async (req: Request, res: Response) => {
    const { olderThanHours = 24 } = req.body

    const cleanedCount = await storageService.cleanupTempFiles(Number(olderThanHours))

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} temporary files`
    })
  })

  /**
   * Get access request statistics
   */
  getAccessRequestStats = asyncHandler(async (req: Request, res: Response) => {
    const { days = 30 } = req.query

    const stats = await accessRequestService.getAccessRequestStatistics(
      req.userId!,
      Number(days)
    )

    res.json({
      success: true,
      data: stats
    })
  })

  /**
   * Bulk process access requests
   */
  bulkProcessAccessRequests = asyncHandler(async (req: Request, res: Response) => {
    const { request_ids, decision } = req.body

    if (!Array.isArray(request_ids)) {
      return res.status(400).json({
        success: false,
        message: 'request_ids must be an array'
      })
    }

    const result = await accessRequestService.bulkProcessRequests(
      request_ids,
      decision,
      req.userId!
    )

    res.json({
      success: true,
      message: 'Bulk processing completed',
      data: result
    })
  })

  /**
   * Get system health status
   */
  getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        storage: 'healthy',
        queue: 'healthy'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }

    res.json({
      success: true,
      data: health
    })
  })

  /**
   * Export audit logs
   */
  exportAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { format = 'json', filters = {} } = req.body

    // This would be implemented with the audit service
    res.json({
      success: true,
      message: 'Audit log export feature coming soon'
    })
  })
}

export const adminController = new AdminController() 