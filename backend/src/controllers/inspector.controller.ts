import { Request, Response } from 'express'
import { asyncHandler } from '../middleware'
import { auditService, AuditLogFilter } from '../services/audit.service'

export class InspectorController {
  /**
   * Get audit logs with filtering
   */
  getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const {
      user_id,
      user_email,
      action,
      entity_type,
      entity_id,
      from_date,
      to_date,
      limit,
      offset
    } = req.query

    const filters: AuditLogFilter = {
      user_id: user_id as string,
      user_email: user_email as string,
      action: action as string,
      entity_type: entity_type as string,
      entity_id: entity_id as string,
      from_date: from_date as string,
      to_date: to_date as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    }

    const result = await auditService.getAuditLogs(filters)

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          total: result.total
        }
      }
    })
  })

  /**
   * Export audit logs
   */
  exportAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const {
      user_id,
      user_email,
      action,
      entity_type,
      entity_id,
      from_date,
      to_date,
      format = 'json'
    } = req.query

    const filters: AuditLogFilter = {
      user_id: user_id as string,
      user_email: user_email as string,
      action: action as string,
      entity_type: entity_type as string,
      entity_id: entity_id as string,
      from_date: from_date as string,
      to_date: to_date as string
    }

    const result = await auditService.exportAuditLogs(filters, format as 'json' | 'csv')

    res.setHeader('Content-Type', result.mime_type)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.data)
  })

  /**
   * Get audit statistics
   */
  getAuditStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { from_date, to_date } = req.query

    const statistics = await auditService.getAuditStatistics(
      from_date as string,
      to_date as string
    )

    res.json({
      success: true,
      data: statistics
    })
  })

  /**
   * Verify audit log integrity
   */
  verifyIntegrity = asyncHandler(async (req: Request, res: Response) => {
    const result = await auditService.verifyAuditLogIntegrity()

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Get compliance report
   */
  getComplianceReport = asyncHandler(async (req: Request, res: Response) => {
    const { from_date, to_date } = req.query

    const report = await auditService.getComplianceReport(
      from_date as string,
      to_date as string
    )

    res.json({
      success: true,
      data: report
    })
  })

  /**
   * Get user audit trail
   */
  getUserAuditTrail = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { limit } = req.query

    const result = await auditService.getUserAuditTrail(
      userId,
      limit ? parseInt(limit as string) : undefined
    )

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Get entity audit trail
   */
  getEntityAuditTrail = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params

    const logs = await auditService.getEntityAuditTrail(entityType, entityId)

    res.json({
      success: true,
      data: {
        logs,
        entity: {
          type: entityType,
          id: entityId
        }
      }
    })
  })

  /**
   * Search audit logs
   */
  searchAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { q: searchTerm, limit } = req.query

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      })
    }

    const logs = await auditService.searchAuditLogs(
      searchTerm as string,
      limit ? parseInt(limit as string) : undefined
    )

    res.json({
      success: true,
      data: {
        logs,
        query: searchTerm
      }
    })
  })

  /**
   * Get critical events
   */
  getCriticalEvents = asyncHandler(async (req: Request, res: Response) => {
    const { hours } = req.query

    const events = await auditService.getCriticalEvents(
      hours ? parseInt(hours as string) : undefined
    )

    res.json({
      success: true,
      data: {
        events,
        period_hours: hours ? parseInt(hours as string) : 24
      }
    })
  })
}

export const inspectorController = new InspectorController() 