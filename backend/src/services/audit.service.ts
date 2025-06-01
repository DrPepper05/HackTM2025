import { supabaseAdmin, withMonitoring } from '../config/supabase.config'
import { AuditLog } from '../types/database.types'
import { createHash } from 'crypto'

export interface AuditLogFilter {
  user_id?: string
  user_email?: string
  action?: string
  entity_type?: string
  entity_id?: string
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

export interface AuditStatistics {
  total_logs: number
  logs_by_action: Record<string, number>
  logs_by_entity_type: Record<string, number>
  logs_by_user: Array<{ user_id: string; user_email: string; count: number }>
  suspicious_activities: Array<{
    user_id: string
    user_email: string
    action: string
    count: number
    timestamp: string
  }>
}

export interface IntegrityCheckResult {
  is_valid: boolean
  total_records: number
  invalid_record?: {
    id: string
    expected_hash: string
    actual_hash: string
    timestamp: string
  }
  check_duration_ms: number
}

export class AuditService {
  /**
   * Create an audit log entry
   * This is typically called by other services, not directly
   */
  // backend/src/services/audit.service.ts

  async createAuditLog(
      action: string,
      entityType: string,
      entityId: string | null,
      details: Record<string, any> = {},
      userId?: string | null,
      userEmail?: string | null,
      ipAddress?: string | null,
      userAgent?: string | null
  ): Promise<string> {
    return withMonitoring('create', 'audit_logs', async () => {
      const finalEntityId = entityId === undefined ? null : entityId;

      const { data, error } = await supabaseAdmin.rpc('create_audit_log', {
        // **IMPORTANT: Ensure these named parameters match the SQL function's EXPECTED names**
        // The order in this object might not strictly matter if Supabase is parsing named parameters,
        // but ensure all are present and correctly typed.
        p_action: action,
        p_details: details, // Ensure details is correctly mapped here
        p_entity_id: finalEntityId,
        p_entity_type: entityType,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null,
        p_user_email: userEmail || null,
        p_user_id: userId || null
      });

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get audit logs with filters (inspector/admin only)
   */
  async getAuditLogs(
    filters: AuditLogFilter = {}
  ): Promise<{
    logs: AuditLog[]
    total: number
  }> {
    return withMonitoring('list', 'audit_logs', async () => {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }

      if (filters.entity_id) {
        query = query.eq('entity_id', filters.entity_id)
      }

      if (filters.from_date) {
        query = query.gte('timestamp', filters.from_date)
      }

      if (filters.to_date) {
        query = query.lte('timestamp', filters.to_date)
      }

      // Order by timestamp descending (newest first)
      query = query.order('timestamp', { ascending: false })

      // Pagination
      const limit = filters.limit || 50
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        logs: data || [],
        total: count || 0
      }
    })
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Verify the integrity of the audit log chain
   */
  async verifyAuditLogIntegrity(): Promise<IntegrityCheckResult> {
    const startTime = Date.now()

    return withMonitoring('verify', 'audit_logs', async () => {
      const { data, error } = await supabaseAdmin.rpc('verify_audit_log_integrity')

      if (error) throw error

      const result = data as any
      const duration = Date.now() - startTime

      // Log the integrity check itself
      await this.createAuditLog(
        'AUDIT_LOG_INTEGRITY_CHECK',
        'system',
        null,
        {
          is_valid: result.is_valid,
          check_duration_ms: duration,
          invalid_record_id: result.invalid_at_id
        }
      )

      // Count total records
      const { count } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      return {
        is_valid: result.is_valid,
        total_records: count || 0,
        invalid_record: result.is_valid ? undefined : {
          id: result.invalid_at_id,
          expected_hash: result.expected_hash,
          actual_hash: result.actual_hash,
          timestamp: new Date().toISOString()
        },
        check_duration_ms: duration
      }
    })
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStatistics(
    fromDate?: string,
    toDate?: string
  ): Promise<AuditStatistics> {
    // Set default date range (last 30 days)
    const endDate = toDate || new Date().toISOString()
    const startDate = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get all logs in date range
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)

    const { data: logs, error } = await query

    if (error) throw error

    const allLogs = logs || []

    // Calculate statistics
    const logsByAction: Record<string, number> = {}
    const logsByEntityType: Record<string, number> = {}
    const logsByUser: Record<string, { email: string; count: number }> = {}

    allLogs.forEach(log => {
      // By action
      logsByAction[log.action] = (logsByAction[log.action] || 0) + 1

      // By entity type
      logsByEntityType[log.entity_type] = (logsByEntityType[log.entity_type] || 0) + 1

      // By user
      if (log.user_id) {
        if (!logsByUser[log.user_id]) {
          logsByUser[log.user_id] = {
            email: log.user_email || 'Unknown',
            count: 0
          }
        }
        logsByUser[log.user_id].count++
      }
    })

    // Find suspicious activities (high frequency actions)
    const suspiciousActivities = this.detectSuspiciousActivities(allLogs)

    // Convert user stats to array
    const userStats = Object.entries(logsByUser)
      .map(([user_id, data]) => ({
        user_id,
        user_email: data.email,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 users

    return {
      total_logs: allLogs.length,
      logs_by_action: logsByAction,
      logs_by_entity_type: logsByEntityType,
      logs_by_user: userStats,
      suspicious_activities: suspiciousActivities
    }
  }

  /**
   * Detect suspicious activities in audit logs
   */
  private detectSuspiciousActivities(logs: AuditLog[]): Array<{
    user_id: string
    user_email: string
    action: string
    count: number
    timestamp: string
  }> {
    const suspicious: Array<{
      user_id: string
      user_email: string
      action: string
      count: number
      timestamp: string
    }> = []

    // Group by user and action within 5-minute windows
    const userActionWindows: Record<string, Record<string, AuditLog[]>> = {}

    logs.forEach(log => {
      if (!log.user_id) return

      const windowKey = Math.floor(new Date(log.timestamp).getTime() / (5 * 60 * 1000))
      const userKey = `${log.user_id}_${windowKey}`

      if (!userActionWindows[userKey]) {
        userActionWindows[userKey] = {}
      }

      if (!userActionWindows[userKey][log.action]) {
        userActionWindows[userKey][log.action] = []
      }

      userActionWindows[userKey][log.action].push(log)
    })

    // Check for suspicious patterns
    const suspiciousPatterns = {
      'LOGIN_FAILED': 5,      // 5 failed logins in 5 minutes
      'DOCUMENT_DOWNLOADED': 20, // 20 downloads in 5 minutes
      'ACCESS_DENIED': 10,    // 10 access denials in 5 minutes
      'DOCUMENT_DELETED': 5   // 5 deletions in 5 minutes
    }

    Object.entries(userActionWindows).forEach(([userWindow, actions]) => {
      Object.entries(actions).forEach(([action, actionLogs]) => {
        const threshold = suspiciousPatterns[action as keyof typeof suspiciousPatterns]
        
        if (threshold && actionLogs.length >= threshold) {
          suspicious.push({
            user_id: actionLogs[0].user_id!,
            user_email: actionLogs[0].user_email || 'Unknown',
            action,
            count: actionLogs.length,
            timestamp: actionLogs[0].timestamp
          })
        }
      })
    })

    return suspicious
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(
    filters: AuditLogFilter,
    format: 'json' | 'csv' = 'json'
  ): Promise<{
    data: string
    filename: string
    mime_type: string
  }> {
    // Get all logs matching filters (no pagination for export)
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')

    // Apply same filters as getAuditLogs
    if (filters.user_id) query = query.eq('user_id', filters.user_id)
    if (filters.action) query = query.eq('action', filters.action)
    if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
    if (filters.entity_id) query = query.eq('entity_id', filters.entity_id)
    if (filters.from_date) query = query.gte('timestamp', filters.from_date)
    if (filters.to_date) query = query.lte('timestamp', filters.to_date)

    query = query.order('timestamp', { ascending: true })

    const { data: logs, error } = await query

    if (error) throw error

    const allLogs = logs || []

    // Log the export action
    await this.createAuditLog(
      'AUDIT_LOG_EXPORTED',
      'audit',
      null,
      {
        record_count: allLogs.length,
        filters,
        format
      }
    )

    // Format data based on requested format
    let exportData: string
    let mimeType: string

    if (format === 'csv') {
      exportData = this.convertToCSV(allLogs)
      mimeType = 'text/csv'
    } else {
        exportData = JSON.stringify(allLogs, null, 2)
        mimeType = 'application/json'
      }
  
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `audit_logs_export_${timestamp}.${format}`
  
      return {
        data: exportData,
        filename,
        mime_type: mimeType
      }
    }
  
    /**
     * Convert audit logs to CSV format
     */
    private convertToCSV(logs: AuditLog[]): string {
      if (logs.length === 0) return ''
  
      // Define CSV headers
      const headers = [
        'ID',
        'Timestamp',
        'User ID',
        'User Email',
        'Action',
        'Entity Type',
        'Entity ID',
        'Details',
        'IP Address',
        'User Agent',
        'Hash'
      ]
  
      // Convert logs to CSV rows
      const rows = logs.map(log => [
        log.id,
        log.timestamp,
        log.user_id || '',
        log.user_email || '',
        log.action,
        log.entity_type,
        log.entity_id || '',
        JSON.stringify(log.details || {}),
        log.ip_address || '',
        log.user_agent || '',
        log.hash
      ])
  
      // Escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
  
      // Build CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n')
  
      return csvContent
    }
  
    /**
     * Get compliance report for Law 16/1996
     */
    async getComplianceReport(
      fromDate?: string,
      toDate?: string
    ): Promise<{
      period: { from: string; to: string }
      document_statistics: {
        total_uploaded: number
        total_registered: number
        total_transferred: number
        by_retention_category: Record<string, number>
      }
      access_statistics: {
        total_requests: number
        approved_requests: number
        rejected_requests: number
        public_document_views: number
      }
      user_activity: {
        active_users: number
        new_registrations: number
        role_distribution: Record<string, number>
      }
      integrity_status: {
        last_check: string | null
        is_valid: boolean
        total_audit_records: number
      }
    }> {
      const endDate = toDate || new Date().toISOString()
      const startDate = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
      // Get document upload statistics
      const { data: uploadLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', 'DOCUMENT_UPLOADED')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
  
      const { data: registeredLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', 'DOCUMENT_STATUS_CHANGED')
        .contains('details', { new_status: 'REGISTERED' })
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
  
      const { data: transferredLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', 'DOCUMENT_STATUS_CHANGED')
        .contains('details', { new_status: 'TRANSFERRED' })
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
  
      // Get retention category distribution
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('retention_category')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
  
      const retentionDistribution: Record<string, number> = {}
      documents?.forEach(doc => {
        if (doc.retention_category) {
          retentionDistribution[doc.retention_category] = 
            (retentionDistribution[doc.retention_category] || 0) + 1
        }
      })
  
      // Get access request statistics
      const { data: accessRequests } = await supabaseAdmin
        .from('access_requests')
        .select('status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
  
      const accessStats = {
        total_requests: accessRequests?.length || 0,
        approved_requests: accessRequests?.filter(r => r.status === 'approved').length || 0,
        rejected_requests: accessRequests?.filter(r => r.status === 'rejected').length || 0,
        public_document_views: 0 // Would need specific tracking
      }
  
      // Get user activity
      const { data: loginLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id')
        .eq('action', 'USER_LOGIN')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
  
      const uniqueActiveUsers = new Set(loginLogs?.map(log => log.user_id) || [])
  
      const { data: newUsers } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
  
      const roleDistribution: Record<string, number> = {}
      newUsers?.forEach(user => {
        roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1
      })
  
      // Get latest integrity check
      const { data: integrityCheck } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', 'AUDIT_LOG_INTEGRITY_CHECK')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
  
      const { count: totalAuditRecords } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
  
      return {
        period: { from: startDate, to: endDate },
        document_statistics: {
          total_uploaded: uploadLogs?.length || 0,
          total_registered: registeredLogs?.length || 0,
          total_transferred: transferredLogs?.length || 0,
          by_retention_category: retentionDistribution
        },
        access_statistics: accessStats,
        user_activity: {
          active_users: uniqueActiveUsers.size,
          new_registrations: newUsers?.length || 0,
          role_distribution: roleDistribution
        },
        integrity_status: {
          last_check: integrityCheck?.timestamp || null,
          is_valid: integrityCheck?.details?.is_valid as boolean || false,
          total_audit_records: totalAuditRecords || 0
        }
      }
    }
  
    /**
     * Search audit logs by text in details
     */
    async searchAuditLogs(
      searchTerm: string,
      limit: number = 50
    ): Promise<AuditLog[]> {
      // Note: This is a simple implementation
      // For production, consider using PostgreSQL full-text search on details JSONB
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .or(`action.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`)
        .order('timestamp', { ascending: false })
        .limit(limit)
  
      if (error) throw error
      return data || []
    }
  
    /**
     * Get audit logs for a specific user
     */
    async getUserAuditTrail(
      userId: string,
      limit: number = 100
    ): Promise<{
      logs: AuditLog[]
      summary: {
        total_actions: number
        first_action: string | null
        last_action: string | null
        most_common_actions: Array<{ action: string; count: number }>
      }
    }> {
      const { data: logs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)
  
      if (error) throw error
  
      const allLogs = logs || []
  
      // Calculate summary
      const actionCounts: Record<string, number> = {}
      allLogs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
      })
  
      const mostCommonActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
  
      return {
        logs: allLogs,
        summary: {
          total_actions: allLogs.length,
          first_action: allLogs.length > 0 ? allLogs[allLogs.length - 1].timestamp : null,
          last_action: allLogs.length > 0 ? allLogs[0].timestamp : null,
          most_common_actions: mostCommonActions
        }
      }
    }
  
    /**
     * Create a special audit entry for system events
     */
    async logSystemEvent(
      event: string,
      details: Record<string, any> = {}
    ): Promise<void> {
      await this.createAuditLog(
        event,
        'system',
        null,
        {
          ...details,
          system_timestamp: new Date().toISOString(),
          node_env: process.env.NODE_ENV
        }
      )
    }
  
    /**
     * Get recent critical events for monitoring
     */
    async getCriticalEvents(
      hours: number = 24
    ): Promise<AuditLog[]> {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
      const criticalActions = [
        'USER_DELETED',
        'DOCUMENT_DELETED',
        'USER_ROLE_CHANGED',
        'AUDIT_LOG_INTEGRITY_CHECK',
        'LOGIN_FAILED',
        'ACCESS_DENIED',
        'PERMISSION_VIOLATION'
      ]
  
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .in('action', criticalActions)
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })
  
      if (error) throw error
      return data || []
    }
  }
  
  // Export singleton instance
export const auditService = new AuditService()
