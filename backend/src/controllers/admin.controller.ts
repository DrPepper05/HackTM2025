import { Request, Response } from 'express'
import {
  queueService,
  lifecycleService,
  storageService,
  accessRequestService,
  AuditLogFilter,
  auditService,
  documentService,
  AccessRequestFilter,
  ProcessAccessRequestDto
} from '../services'
import { asyncHandler } from '../middleware'

export class AdminController {
  /**
   * Get system overview dashboard
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const [
      queueStats,
      documentStats,
      storageStats,
      accessRequestStats
    ] = await Promise.all([
      queueService.getTaskStatistics(),
      documentService.getDocumentStatistics(),
      storageService.getStorageStatistics(),
      accessRequestService.getAccessRequestStatistics(req.userId!, 30)
    ])

    // Calculate lifecycle counts based on actual document statuses
    const lifecycleData = {
      pendingReview: (documentStats.byStatus['REVIEW'] || 0) + (documentStats.byStatus['NEEDS_CLASSIFICATION'] || 0),
      toTransfer: documentStats.byStatus['AWAITING_TRANSFER'] || 0,
      toDestroy: documentStats.byStatus['DESTROY'] || 0
    }

    res.json({
      success: true,
      data: {
        queue: queueStats,
        lifecycle: lifecycleData,
        storage: storageStats,
        accessRequests: accessRequestStats,
        documents: documentStats
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
   * Get all access requests for staff management
   */
  getAccessRequests = asyncHandler(async (req: Request, res: Response) => {
    const { 
      status, 
      documentId, 
      requesterEmail, 
      fromDate, 
      toDate, 
      limit = 20, 
      offset = 0 
    } = req.query

    const filters: AccessRequestFilter = {}
    if (status) filters.status = status as any
    if (documentId) filters.documentId = documentId as string
    if (requesterEmail) filters.requesterEmail = requesterEmail as string
    if (fromDate) filters.fromDate = fromDate as string
    if (toDate) filters.toDate = toDate as string
    if (limit) filters.limit = Number(limit)
    if (offset) filters.offset = Number(offset)

    const result = await accessRequestService.getAccessRequests(
      filters,
      req.userId!
    )

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Update access request status
   */
  updateAccessRequest = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { status, rejectionReason, notes } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      })
    }

    const decision: ProcessAccessRequestDto = {
      status,
      rejectionReason,
      notes
    }

    const result = await accessRequestService.processAccessRequest(
      id,
      decision,
      req.userId!
    )

    res.json({
      success: true,
      data: result
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
    // Extract filters and format from the request body or query parameters
    // For a POST request, they'd typically be in req.body
    const { filters, format } = req.body as { filters: AuditLogFilter, format: 'json' | 'csv' };

    // Validate format if necessary (though your service method already handles unsupported formats)
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({ success: false, message: 'Invalid export format. Must be "json" or "csv".' });
    }

    // Call the audit service to get the formatted data and file metadata
    const { data: exportedData, filename, mime_type } = await auditService.exportAuditLogs(filters, format);

    // Set the Content-Type header based on the MIME type returned by the service
    res.setHeader('Content-Type', mime_type);

    // Set the Content-Disposition header to prompt the browser to download the file
    // 'attachment' tells the browser to download, and 'filename' specifies the default file name
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the exported data as the response
    res.send(exportedData);
  });
}

export const adminController = new AdminController() 
