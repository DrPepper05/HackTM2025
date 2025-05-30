import { supabaseAdmin, withMonitoring, verifyUserRole } from '../config/supabase.config'
import { AccessRequest, AccessRequestStatus } from '../types/database.types'
import { sendMail } from './email'
import { format } from 'date-fns'

export interface CreateAccessRequestDto {
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  requesterIdNumber?: string
  requesterOrganization?: string
  documentId?: string
  justification: string
  intendedUse?: string
}

export interface ProcessAccessRequestDto {
  status: 'approved' | 'rejected'
  rejectionReason?: string
  notes?: string
}

export interface AccessRequestFilter {
  status?: AccessRequestStatus
  documentId?: string
  requesterEmail?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

export class AccessRequestService {
  /**
   * Create a new access request (public interface)
   */
  async createAccessRequest(requestData: CreateAccessRequestDto): Promise<AccessRequest> {
    return withMonitoring('create', 'access_requests', async () => {
      // Validate document exists and is eligible for access request
      if (requestData.documentId) {
        const { data: document, error } = await supabaseAdmin
          .from('documents')
          .select('id, is_public, status')
          .eq('id', requestData.documentId)
          .single()

        if (error) {
          throw new Error('Document not found')
        }

        if (document.is_public) {
          throw new Error('Document is already public, no access request needed')
        }

        if (!['REGISTERED', 'ACTIVE_STORAGE'].includes(document.status)) {
          throw new Error('Document is not available for access requests')
        }
      }

      // Create access request
      const { data, error } = await supabaseAdmin
        .from('access_requests')
        .insert({
          requester_name: requestData.requesterName,
          requester_email: requestData.requesterEmail,
          requester_phone: requestData.requesterPhone,
          requester_id_number: requestData.requesterIdNumber,
          requester_organization: requestData.requesterOrganization,
          document_id: requestData.documentId,
          justification: requestData.justification,
          intended_use: requestData.intendedUse,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Log the access request
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_CREATED',
        p_entity_type: 'access_request',
        p_entity_id: data.id,
        p_details: {
          requester_email: requestData.requesterEmail,
          document_id: requestData.documentId,
          justification: requestData.justification
        }
      })

      // Send notification email (mock for hackathon)
      await this.sendRequestConfirmationEmail(data)

      return data
    })
  }

  /**
   * Get access requests with filters (staff only)
   */
  async getAccessRequests(
    filters: AccessRequestFilter = {},
    userId: string
  ): Promise<{
    requests: AccessRequest[]
    total: number
  }> {
    // Verify user has permission to view access requests
    const hasPermission = await verifyUserRole(userId, ['clerk', 'archivist', 'inspector', 'admin'])
    if (!hasPermission) {
      throw new Error('Unauthorized: Insufficient permissions')
    }

    return withMonitoring('list', 'access_requests', async () => {
      let query = supabaseAdmin
        .from('access_requests')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.documentId) {
        query = query.eq('document_id', filters.documentId)
      }

      if (filters.requesterEmail) {
        query = query.ilike('requester_email', `%${filters.requesterEmail}%`)
      }

      if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate)
      }

      if (filters.toDate) {
        query = query.lte('created_at', filters.toDate)
      }

      // Order by created date (newest first)
      query = query.order('created_at', { ascending: false })

      // Apply pagination
      const limit = filters.limit || 20
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        requests: data || [],
        total: count || 0
      }
    })
  }

  /**
   * Process an access request (approve/reject)
   */
  async processAccessRequest(
    requestId: string,
    decision: ProcessAccessRequestDto,
    processingUserId: string
  ): Promise<AccessRequest> {
    // Verify user has permission to process requests
    const hasPermission = await verifyUserRole(processingUserId, ['archivist', 'admin'])
    if (!hasPermission) {
      throw new Error('Unauthorized: Only archivists and admins can process access requests')
    }

    return withMonitoring('update', 'access_requests', async () => {
      // Get current request
      const { data: currentRequest, error: fetchError } = await supabaseAdmin
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError || !currentRequest) {
        throw new Error('Access request not found')
      }

      if (currentRequest.status !== 'pending') {
        throw new Error('Access request has already been processed')
      }

      // Validate rejection reason if rejecting
      if (decision.status === 'rejected' && !decision.rejectionReason) {
        throw new Error('Rejection reason is required when rejecting a request')
      }

      // Update request
      const { data, error } = await supabaseAdmin
        .from('access_requests')
        .update({
          status: decision.status,
          processed_by_user_id: processingUserId,
          processed_at: new Date().toISOString(),
          rejection_reason: decision.rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      // Log the decision
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_PROCESSED',
        p_entity_type: 'access_request',
        p_entity_id: requestId,
        p_details: {
          decision: decision.status,
          processed_by: processingUserId,
          rejection_reason: decision.rejectionReason,
          previous_status: currentRequest.status
        }
      })

      // Send notification email to requester
      await this.sendDecisionNotificationEmail(data, decision.status)

      return data
    })
  }

  /**
   * Get access request by ID
   */
  async getAccessRequestById(
    requestId: string,
    userId?: string
  ): Promise<AccessRequest | null> {
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // If user is provided, check if they have permission or are the requester
    if (userId) {
      const hasPermission = await verifyUserRole(userId, ['clerk', 'archivist', 'inspector', 'admin'])
      if (!hasPermission) {
        // Check if user made this request (for status checking)
        const { data: userProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('email')
          .eq('id', userId)
          .single()

        if (!userProfile || userProfile.email !== data.requester_email) {
          throw new Error('Unauthorized: Cannot view this access request')
        }
      }
    }

    return data
  }

  /**
   * Get access requests by requester email (for status checking)
   */
  async getRequestsByEmail(email: string): Promise<AccessRequest[]> {
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('requester_email', email.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get access request statistics
   */
  async getAccessRequestStatistics(
    userId: string,
    days: number = 30
  ): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
    byMonth: Array<{ month: string; count: number }>
    averageProcessingTime: number
  }> {
    // Verify permission
    const hasPermission = await verifyUserRole(userId, ['archivist', 'inspector', 'admin'])
    if (!hasPermission) {
      throw new Error('Unauthorized: Insufficient permissions')
    }

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: requests, error } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .gte('created_at', since.toISOString())

    if (error) throw error

    const stats = {
      total: requests?.length || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byMonth: [] as Array<{ month: string; count: number }>,
      averageProcessingTime: 0
    }

    if (!requests?.length) return stats

    // Count by status
    let totalProcessingTime = 0
    let processedCount = 0
    const monthCounts: Record<string, number> = {}

    requests.forEach(request => {
      // Count by status
      if (request.status === 'pending') stats.pending++
      else if (request.status === 'approved') stats.approved++
      else if (request.status === 'rejected') stats.rejected++

      // Calculate processing time for completed requests
      if (request.processed_at) {
        const processingTime = new Date(request.processed_at).getTime() - 
                              new Date(request.created_at).getTime()
        totalProcessingTime += processingTime
        processedCount++
      }

      // Count by month
      const month = new Date(request.created_at).toISOString().substring(0, 7) // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1
    })

    // Calculate average processing time in hours
    stats.averageProcessingTime = processedCount > 0 
      ? Math.round((totalProcessingTime / processedCount) / (1000 * 60 * 60)) 
      : 0

    // Convert month counts to array
    stats.byMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return stats
  }

  /**
   * Cancel an access request (requester only)
   */
  async cancelAccessRequest(
    requestId: string,
    requesterEmail: string
  ): Promise<void> {
    return withMonitoring('cancel', 'access_requests', async () => {
      // Get request and verify ownership
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .eq('requester_email', requesterEmail.toLowerCase())
        .single()

      if (fetchError || !request) {
        throw new Error('Access request not found or you do not have permission to cancel it')
      }

      if (request.status !== 'pending') {
        throw new Error('Cannot cancel a request that has already been processed')
      }

      // Update status to rejected with special reason
      const { error } = await supabaseAdmin
        .from('access_requests')
        .update({
          status: 'rejected',
          rejection_reason: 'Cancelled by requester',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // Log cancellation
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_CANCELLED',
        p_entity_type: 'access_request',
        p_entity_id: requestId,
        p_details: {
          cancelled_by_requester: true,
          requester_email: requesterEmail
        }
      })
    })
  }

  /**
   * Private helper methods for email notifications (mock implementations)
   */
  async sendRequestConfirmationEmail(accessRequest: AccessRequest) {
    const timestamp = format(new Date(accessRequest.created_at), 'yyyy-MM-dd HH:mm:ss');
    const documentId = accessRequest.document_id || 'N/A';

    const html = `
    <h2>Access Request Confirmation</h2>
    <p>Hello ${accessRequest.requester_name},</p>
    <p>Thank you for submitting an access request to OpenArchive.</p>
    <p><strong>Document ID:</strong> ${documentId}</p>
    <p><strong>Justification:</strong> ${accessRequest.justification}</p>
    <p><strong>Status:</strong> ${accessRequest.status}</p>
    <p><strong>Requested At:</strong> ${timestamp}</p>
    <br/>
    <p>You will receive an email once your request is approved or rejected.</p>
    <p>— OpenArchive Team</p`;

    await sendMail({
      to: accessRequest.requester_email,
      subject: 'Access Request Confirmation',
      html
    });
  }
  // private async sendRequestConfirmationEmail(request: AccessRequest): Promise<void> {
    // Mock email sending
    // console.log(`Sending confirmation email to ${request.requester_email} for request ${request.id}`)
    
    // // Log email sent
    // await supabaseAdmin.rpc('create_audit_log', {
    //   p_action: 'EMAIL_SENT',
    //   p_entity_type: 'access_request',
    //   p_entity_id: request.id,
    //   p_details: {
    //     email_type: 'confirmation',
    //     recipient: request.requester_email
    //   }
    // })
  //}

  private async sendDecisionNotificationEmail(
    request: AccessRequest,
    decision: 'approved' | 'rejected'
  ): Promise<void> {
    // Mock email sending
    console.log(`Sending ${decision} notification to ${request.requester_email} for request ${request.id}`)
    
    // Log email sent
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'EMAIL_SENT',
      p_entity_type: 'access_request',
      p_entity_id: request.id,
      p_details: {
        email_type: 'decision_notification',
        decision,
        recipient: request.requester_email
      }
    })
  }

  /**
   * Bulk approve/reject requests (admin only)
   */
  async bulkProcessRequests(
    requestIds: string[],
    decision: ProcessAccessRequestDto,
    processingUserId: string
  ): Promise<{ processed: number; errors: string[] }> {
    // Verify admin permission
    const isAdmin = await verifyUserRole(processingUserId, ['admin'])
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin role required for bulk processing')
    }

    const results = { processed: 0, errors: [] as string[] }

    for (const requestId of requestIds) {
      try {
        await this.processAccessRequest(requestId, decision, processingUserId)
        results.processed++
      } catch (error) {
        results.errors.push(`${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log bulk operation
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'BULK_ACCESS_REQUEST_PROCESSING',
      p_entity_type: 'access_request',
      p_entity_id: null,
      p_details: {
        request_count: requestIds.length,
        processed_count: results.processed,
        error_count: results.errors.length,
        decision: decision.status,
        processed_by: processingUserId
      }
    })

    return results
  }
}

export const accessRequestService = new AccessRequestService() 