// backend/src/services/access-request.service.ts
import { supabaseAdmin, withMonitoring, verifyUserRole } from '../config/supabase.config';
import { AccessRequest, AccessRequestStatus, UserProfile } from '../types/database.types';
import { emailService, MailOptions } from './email.service'; // Import the real emailService and MailOptions

export interface CreateAccessRequestDto {
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterIdNumber?: string;
  requesterOrganization?: string;
  documentId?: string; // Can be null if it's a general access request
  justification: string;
  intendedUse?: string;
}

export interface ProcessAccessRequestDto {
  status: 'approved' | 'rejected'; // Only these two are valid for processing
  rejectionReason?: string;
  notes?: string; // Internal notes for the processing staff
}

export interface AccessRequestFilter {
  status?: AccessRequestStatus;
  documentId?: string;
  requesterEmail?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export class AccessRequestService {
  /**
   * Create a new access request (public interface)
   */
  async createAccessRequest(requestData: CreateAccessRequestDto): Promise<AccessRequest> {
    return withMonitoring('create', 'access_requests', async () => {
      // Validate document exists and is eligible for access request if documentId is provided
      if (requestData.documentId) {
        const { data: document, error: docError } = await supabaseAdmin
          .from('documents')
          .select('id, is_public, status, title') // Added title for email
          .eq('id', requestData.documentId)
          .single();

        if (docError || !document) {
          throw new Error('Document not found or error fetching document.');
        }

        if (document.is_public) {
          throw new Error('Document is already public, no access request needed.');
        }

        // Define statuses that allow access requests
        const eligibleStatuses: AccessRequestStatus[] = ['REGISTERED' as any, 'ACTIVE_STORAGE' as any]; // Type assertion might be needed if DocumentStatus and AccessRequestStatus enums differ in compatible values
        if (!eligibleStatuses.includes(document.status as any)) {
          throw new Error(`Document with status "${document.status}" is not available for access requests.`);
        }
      }

      // Create access request
      const { data, error } = await supabaseAdmin
        .from('access_requests')
        .insert({
          requester_name: requestData.requesterName,
          requester_email: requestData.requesterEmail.toLowerCase(), // Store email in lowercase
          requester_phone: requestData.requesterPhone,
          requester_id_number: requestData.requesterIdNumber,
          requester_organization: requestData.requesterOrganization,
          document_id: requestData.documentId,
          justification: requestData.justification,
          intended_use: requestData.intendedUse,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating access request in DB:', error);
        throw error;
      }

      // Log the access request creation
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_CREATED',
        p_entity_type: 'access_request',
        p_entity_id: data.id,
        p_details: {
          requester_email: data.requester_email,
          document_id: data.document_id,
          justification: data.justification,
        },
      });

      // Send confirmation email
      await this.sendRequestConfirmationEmail(data);

      return data;
    });
  }

  /**
   * Get access requests with filters (staff only)
   */
  async getAccessRequests(
    filters: AccessRequestFilter = {},
    userId: string
  ): Promise<{
    requests: AccessRequest[];
    total: number;
  }> {
    const hasPermission = await verifyUserRole(userId, ['clerk', 'archivist', 'inspector', 'admin']);
    if (!hasPermission) {
      throw new Error('Unauthorized: Insufficient permissions to view access requests.');
    }

    return withMonitoring('list', 'access_requests', async () => {
      let query = supabaseAdmin
        .from('access_requests')
        .select('*, documents (id, title)', { count: 'exact' }); // Include document title

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.documentId) query = query.eq('document_id', filters.documentId);
      if (filters.requesterEmail) query = query.ilike('requester_email', `%${filters.requesterEmail}%`);
      if (filters.fromDate) query = query.gte('created_at', filters.fromDate);
      if (filters.toDate) query = query.lte('created_at', filters.toDate);

      query = query.order('created_at', { ascending: false });

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching access requests:', error);
        throw error;
      }

      return {
        requests: (data || []).map(req => ({
            ...req,
            // @ts-ignore Supabase TS generation for joined tables can be tricky
            document_title: req.documents?.title 
        })) as AccessRequest[],
        total: count || 0,
      };
    });
  }

  /**
   * Process an access request (approve/reject) by staff
   */
  async processAccessRequest(
    requestId: string,
    decision: ProcessAccessRequestDto,
    processingUserId: string
  ): Promise<AccessRequest> {
    const hasPermission = await verifyUserRole(processingUserId, ['archivist', 'admin']);
    if (!hasPermission) {
      throw new Error('Unauthorized: Only archivists and admins can process access requests.');
    }

    return withMonitoring('process', 'access_requests', async () => {
      const { data: currentRequest, error: fetchError } = await supabaseAdmin
        .from('access_requests')
        .select('*, documents (id, title)') // Include document title for email
        .eq('id', requestId)
        .single();

      if (fetchError || !currentRequest) {
        throw new Error('Access request not found.');
      }

      if (currentRequest.status !== 'pending') {
        throw new Error('Access request has already been processed.');
      }

      if (decision.status === 'rejected' && (!decision.rejectionReason || decision.rejectionReason.trim() === '')) {
        throw new Error('Rejection reason is required when rejecting an access request.');
      }

      const { data: updatedRequest, error: updateError } = await supabaseAdmin
        .from('access_requests')
        .update({
          status: decision.status,
          processed_by_user_id: processingUserId,
          processed_at: new Date().toISOString(),
          rejection_reason: decision.status === 'rejected' ? decision.rejectionReason : null,
          // notes: decision.notes, // If you add a 'notes' column to access_requests table
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select('*, documents (id, title)') // Re-select to get the latest data with join
        .single();

      if (updateError) {
        console.error('Error updating access request in DB:', updateError);
        throw updateError;
      }

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_PROCESSED',
        p_entity_type: 'access_request',
        p_entity_id: requestId,
        p_details: {
          decision: decision.status,
          processed_by: processingUserId,
          rejection_reason: decision.rejectionReason,
          previous_status: currentRequest.status,
          // internal_notes: decision.notes,
        },
      });

      await this.sendDecisionNotificationEmail(updatedRequest);

      return updatedRequest;
    });
  }

  /**
   * Get access request by ID (can be called by requester or staff)
   */
  async getAccessRequestById(
    requestId: string,
    requestingUserId?: string // Optional: if provided, will check permissions
  ): Promise<AccessRequest | null> {
    const { data: request, error } = await supabaseAdmin
      .from('access_requests')
      .select('*, documents (id, title)')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching access request by ID:', error);
      throw error;
    }
    
    if (requestingUserId) {
      const profile = await supabaseAdmin.from('user_profiles').select('email, role').eq('id', requestingUserId).single();
      const userEmail = profile.data?.email;
      const userRole = profile.data?.role;

      const canStaffAccess = userRole && ['clerk', 'archivist', 'inspector', 'admin'].includes(userRole);
      const isRequester = userEmail && userEmail.toLowerCase() === request.requester_email.toLowerCase();

      if (!canStaffAccess && !isRequester) {
        throw new Error('Unauthorized: You do not have permission to view this access request.');
      }
    }
    // @ts-ignore
    if (request.documents && !Array.isArray(request.documents)) { // Supabase might return object instead of array for single join
        // @ts-ignore
        request.document_title = request.documents.title;
    }


    return request as AccessRequest;
  }

  /**
   * Get access requests submitted by a specific email address
   */
  async getRequestsByEmail(email: string): Promise<AccessRequest[]> {
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select('*, documents (id, title)')
      .eq('requester_email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests by email:', error);
      throw error;
    }
    return (data || []).map(req => ({
        ...req,
        // @ts-ignore
        document_title: req.documents?.title
    })) as AccessRequest[];
  }

  // Updated to use the new emailService
  private async sendRequestConfirmationEmail(request: AccessRequest): Promise<void> {
    // @ts-ignore
    const documentTitle = request.documents?.title || (request.document_id ? `Document ID ${request.document_id.substring(0,8)}...` : 'general information');
    const mailSubject = `OpenArchive: Access Request Received (ID: ${request.id.substring(0, 8)})`;
    const mailBody = `
Dear ${request.requester_name},

Thank you for your access request for ${documentTitle}.
Your request ID is: ${request.id}

We have received your justification:
"${request.justification}"

Your request is currently pending review. You will be notified once a decision has been made.

Sincerely,
The OpenArchive Team
    `.trim();

    try {
      await emailService.sendMail({
        to: request.requester_email,
        subject: mailSubject,
        textBody: mailBody,
      });
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_CONFIRMATION_EMAIL_INITIATED',
        p_entity_type: 'access_request',
        p_entity_id: request.id,
        p_details: {
          email_type: 'confirmation',
          recipient: request.requester_email
        }
      });
    } catch (error) {
      console.error(`Failed to send confirmation email for request ${request.id}:`, error);
    }
  }

  // Updated to use the new emailService
  private async sendDecisionNotificationEmail(
    request: AccessRequest // This should now include document title if joined
  ): Promise<void> {
    const decision = request.status; // status is now 'approved' or 'rejected'
    // @ts-ignore
    const documentTitle = request.documents?.title || (request.document_id ? `Document ID ${request.document_id.substring(0,8)}...` : 'the requested information');
    
    const mailSubject = `OpenArchive: Update on Your Access Request (ID: ${request.id.substring(0, 8)}) - ${String(decision).toUpperCase()}`;
    let mailBody = `
Dear ${request.requester_name},

This email is to inform you about an update on your access request (ID: ${request.id}) for ${documentTitle}.

Your request has been: ${String(decision).toUpperCase()}
    `.trim();

    if (decision === 'rejected') {
      mailBody += `\n\nReason for rejection: ${request.rejection_reason || 'No specific reason provided.'}`;
    } else if (decision === 'approved') {
      mailBody += `\n\nAccess to ${documentTitle} has been granted.`;
      if (request.document_id) {
        const documentAccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/${request.document_id}`; //
        mailBody += `\nYou may be able to access the document here: ${documentAccessUrl}`;
      }
    }

    mailBody += `\n\nIf you have any questions, please contact our support team.

Sincerely,
The OpenArchive Team
    `.trim();

    try {
      await emailService.sendMail({
        to: request.requester_email,
        subject: mailSubject,
        textBody: mailBody,
      });
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_DECISION_EMAIL_INITIATED',
        p_entity_type: 'access_request',
        p_entity_id: request.id,
        p_details: {
          email_type: 'decision_notification',
          decision,
          recipient: request.requester_email
        }
      });
    } catch (error) {
      console.error(`Failed to send ${decision} notification for request ${request.id}:`, error);
    }
  }
  
  async getAccessRequestStatistics(
    userId: string, // For permission check
    days: number = 30
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byMonth: Array<{ month: string; count: number }>;
    averageProcessingTimeHours: number; // Changed to hours
  }> {
    const hasPermission = await verifyUserRole(userId, ['archivist', 'inspector', 'admin']);
    if (!hasPermission) {
      throw new Error('Unauthorized: Insufficient permissions for statistics.');
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: requests, error } = await supabaseAdmin
      .from('access_requests')
      .select('created_at, status, processed_at')
      .gte('created_at', since.toISOString());

    if (error) {
        console.error('Error fetching access request statistics:', error);
        throw error;
    }

    const stats = {
      total: requests?.length || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byMonth: [] as Array<{ month: string; count: number }>,
      averageProcessingTimeHours: 0,
    };

    if (!requests || requests.length === 0) return stats;

    let totalProcessingTimeMs = 0;
    let processedCount = 0;
    const monthCounts: Record<string, number> = {};

    requests.forEach(req => {
      if (req.status === 'pending') stats.pending++;
      else if (req.status === 'approved') stats.approved++;
      else if (req.status === 'rejected') stats.rejected++;

      if (req.processed_at && req.status !== 'pending') {
        const processingTime = new Date(req.processed_at).getTime() - new Date(req.created_at).getTime();
        if (processingTime > 0) { // Ensure valid time
            totalProcessingTimeMs += processingTime;
            processedCount++;
        }
      }

      const month = new Date(req.created_at).toISOString().substring(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    stats.averageProcessingTimeHours = processedCount > 0
      ? Math.round(totalProcessingTimeMs / processedCount / (1000 * 60 * 60))
      : 0;

    stats.byMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return stats;
  }

  async bulkProcessRequests(
    requestIds: string[],
    decision: ProcessAccessRequestDto, // status and rejectionReason
    processingUserId: string
  ): Promise<{ processed: number; errors: Array<{ id: string; error: string }> }> {
    const hasPermission = await verifyUserRole(processingUserId, ['admin']); // Or 'archivist'
    if (!hasPermission) {
      throw new Error('Unauthorized: Admin or Archivist role required for bulk processing.');
    }

    const results = { processed: 0, errors: [] as Array<{ id: string; error: string }> };

    for (const requestId of requestIds) {
      try {
        // Fetch the request to pass to sendDecisionNotificationEmail
        const { data: currentRequest, error: fetchErr } = await supabaseAdmin
            .from('access_requests')
            .select('*, documents (id, title)')
            .eq('id', requestId)
            .single();

        if (fetchErr || !currentRequest) {
            results.errors.push({ id: requestId, error: 'Request not found or error fetching.' });
            continue;
        }
        if (currentRequest.status !== 'pending') {
            results.errors.push({ id: requestId, error: 'Request already processed.' });
            continue;
        }
        
        const { data: updatedRequest, error: processErr } = await supabaseAdmin
            .from('access_requests')
            .update({
                status: decision.status,
                processed_by_user_id: processingUserId,
                processed_at: new Date().toISOString(),
                rejection_reason: decision.status === 'rejected' ? decision.rejectionReason : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', requestId)
            .eq('status', 'pending') // Ensure we only update pending requests
            .select('*, documents (id, title)')
            .single();

        if (processErr) {
          throw processErr;
        }
        if (!updatedRequest){ // If update didn't return data (e.g. status was not pending)
            results.errors.push({ id: requestId, error: 'Failed to update or request was not pending.' });
            continue;
        }
        
        // Log individual processing for audit
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'ACCESS_REQUEST_PROCESSED', // Consistent with single processing
            p_entity_type: 'access_request',
            p_entity_id: requestId,
            p_details: { 
                decision: decision.status,
                processed_by: processingUserId,
                rejection_reason: decision.rejectionReason,
                previous_status: 'pending', // Assuming bulk only targets pending
                bulk_operation: true
            }
        });

        await this.sendDecisionNotificationEmail(updatedRequest);
        results.processed++;

      } catch (error) {
        results.errors.push({ id: requestId, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Log the overall bulk operation
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'BULK_ACCESS_REQUEST_PROCESSING_COMPLETED',
      p_entity_type: 'system_task', // Or 'access_request_bulk'
      p_entity_id: null, 
      p_details: {
        total_attempted: requestIds.length,
        successfully_processed: results.processed,
        errors_encountered: results.errors.length,
        decision_applied: decision.status,
        processed_by_user_id: processingUserId,
      },
    });

    return results;
  }


  async cancelAccessRequest(
    requestId: string,
    requesterEmail: string // To verify ownership
  ): Promise<void> {
    return withMonitoring('cancel', 'access_requests', async () => {
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('access_requests')
        .select('id, status, requester_email')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        throw new Error('Access request not found.');
      }

      if (request.requester_email.toLowerCase() !== requesterEmail.toLowerCase()) {
        throw new Error('Unauthorized: You can only cancel your own requests.');
      }

      if (request.status !== 'pending') {
        throw new Error('Cannot cancel a request that has already been processed.');
      }

      const { error: updateError } = await supabaseAdmin
        .from('access_requests')
        .update({
          status: 'rejected', // Or a new 'cancelled' status if you add one
          rejection_reason: 'Cancelled by requester.',
          processed_at: new Date().toISOString(), // Mark as processed
          // processed_by_user_id: null, // Or a system user ID
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error cancelling access request:', updateError);
        throw updateError;
      }

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'ACCESS_REQUEST_CANCELLED',
        p_entity_type: 'access_request',
        p_entity_id: requestId,
        p_details: {
          cancelled_by_requester: true,
          requester_email: requesterEmail,
        },
      });
    });
  }

}

export const accessRequestService = new AccessRequestService();