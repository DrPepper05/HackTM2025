// backend/src/services/access-request.service.ts
import { supabaseAdmin, withMonitoring, verifyUserRole } from '../config/supabase.config';
import { AccessRequest, AccessRequestStatus, UserProfile, Document } from '../types/database.types'; // Added Document
import { emailService, MailOptions } from './email.service';

export interface CreateAccessRequestDto {
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterIdNumber?: string;
  requesterOrganization?: string;
  documentId?: string | null; // Allow null for optional, or omit field
  justification: string;
  intendedUse?: string;
}

export interface ProcessAccessRequestDto {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  notes?: string;
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

// Define a type for documents joined with access requests if needed
type DocumentForAccessRequest = Pick<Document, 'id' | 'title' | 'is_public' | 'status'>;


export class AccessRequestService {
  /**
   * Create a new access request (public interface)
   */
  async createAccessRequest(requestData: CreateAccessRequestDto): Promise<AccessRequest> {
    return withMonitoring('create', 'access_requests', async () => {
      let documentData: DocumentForAccessRequest | null = null;

      if (requestData.documentId) {
        // <<<--- DEBUG LOGGING BLOCK ---<<<
        console.log('--- DEBUG: AccessRequestService ---');
        console.log(`Received documentId in service: "${requestData.documentId}"`);
        console.log(`Type of documentId: ${typeof requestData.documentId}`);
        if (requestData.documentId) { // Check if not null before accessing length
            console.log(`Length of documentId string: ${requestData.documentId.length}`);
        }
        console.log('--- END DEBUG ---');
        // >>>------------------------------------>>>

        const { data: document, error: docError } = await supabaseAdmin
          .from('documents')
          .select('id, is_public, status, title')
          .eq('id', requestData.documentId)
          .single();

        if (docError || !document) {
          if (docError) {
            console.error("Detailed Supabase error fetching document:", JSON.stringify(docError, null, 2));
            throw new Error(`Database error fetching document: ${docError.message}`);
          }
          throw new Error(`Document with ID '${requestData.documentId}' not found.`);
        }
        documentData = document; // Store for later use

        if (document.is_public) {
          throw new Error('Document is already public, no access request needed.');
        }

        const eligibleStatuses: DocumentStatus[] = ['REGISTERED', 'ACTIVE_STORAGE'];
        if (!eligibleStatuses.includes(document.status)) {
          throw new Error(`Document with status "${document.status}" is not available for access requests.`);
        }
      }

      const { data, error } = await supabaseAdmin
        .from('access_requests')
        .insert({
          requester_name: requestData.requesterName,
          requester_email: requestData.requesterEmail.toLowerCase(),
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
        console.error('Error inserting access request in DB:', error);
        throw error;
      }

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

      // Pass documentData (which might include title) to email function
      await this.sendRequestConfirmationEmail(data, documentData);

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
    requests: Array<AccessRequest & { document_title?: string }>;
    total: number;
  }> {
    const hasPermission = await verifyUserRole(userId, ['clerk', 'archivist', 'inspector', 'admin']);
    if (!hasPermission) {
      throw new Error('Unauthorized: Insufficient permissions to view access requests.');
    }

    return withMonitoring('list', 'access_requests', async () => {
      let query = supabaseAdmin
        .from('access_requests')
        .select('*, documents (id, title)', { count: 'exact' });

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
      
      const requestsWithTitle = (data || []).map(req => {
        const typedReq = req as any; // Type assertion for Supabase join result
        return {
          ...typedReq,
          document_title: typedReq.documents?.title 
        };
      });

      return {
        requests: requestsWithTitle,
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
        .select('*, documents (id, title)')
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select('*, documents (id, title)')
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
        },
      });

      await this.sendDecisionNotificationEmail(updatedRequest as AccessRequest & { documents: DocumentForAccessRequest | null });

      return updatedRequest;
    });
  }

  /**
   * Get access request by ID (can be called by requester or staff)
   */
  async getAccessRequestById(
    requestId: string,
    requestingUserId?: string
  ): Promise<(AccessRequest & { document_title?: string }) | null> {
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select('*, documents (id, title)')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching access request by ID:', error);
      throw error;
    }
    
    const request = data as any; // Type assertion for Supabase join result

    if (requestingUserId) {
      const {data: profile, error: profileError} = await supabaseAdmin
        .from('user_profiles')
        .select('email, role')
        .eq('id', requestingUserId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const userEmail = profile?.email;
      const userRole = profile?.role;

      const canStaffAccess = userRole && ['clerk', 'archivist', 'inspector', 'admin'].includes(userRole);
      const isRequester = userEmail && userEmail.toLowerCase() === request.requester_email.toLowerCase();

      if (!canStaffAccess && !isRequester) {
        throw new Error('Unauthorized: You do not have permission to view this access request.');
      }
    }
    
    return {
        ...request,
        document_title: request.documents?.title
    };
  }

  /**
   * Get access requests submitted by a specific email address
   */
  async getRequestsByEmail(email: string): Promise<Array<AccessRequest & { document_title?: string }>> {
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select('*, documents (id, title)')
      .eq('requester_email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests by email:', error);
      throw error;
    }
    return (data || []).map(req => {
        const typedReq = req as any;
        return {
          ...typedReq,
          document_title: typedReq.documents?.title
        };
    });
  }

  private async sendRequestConfirmationEmail(request: AccessRequest, documentData?: DocumentForAccessRequest | null): Promise<void> {
    const documentTitle = documentData?.title || (request.document_id ? `Document ID ${request.document_id.substring(0,8)}...` : 'general information');
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

  private async sendDecisionNotificationEmail(
    request: AccessRequest & { documents?: DocumentForAccessRequest | null }
  ): Promise<void> {
    const decision = request.status as 'approved' | 'rejected'; // Assuming status is one of these after processing
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
        const documentAccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/${request.document_id}`;
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
    userId: string,
    days: number = 30
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byMonth: Array<{ month: string; count: number }>;
    averageProcessingTimeHours: number;
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
        if (processingTime > 0) {
            totalProcessingTimeMs += processingTime;
            processedCount++;
        }
      }

      const month = new Date(req.created_at).toISOString().substring(0, 7);
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
    decision: ProcessAccessRequestDto,
    processingUserId: string
  ): Promise<{ processed: number; errors: Array<{ id: string; error: string }> }> {
    const hasPermission = await verifyUserRole(processingUserId, ['admin', 'archivist']);
    if (!hasPermission) {
      throw new Error('Unauthorized: Admin or Archivist role required for bulk processing.');
    }

    const results = { processed: 0, errors: [] as Array<{ id: string; error: string }> };

    for (const requestId of requestIds) {
      try {
        const { data: currentRequest, error: fetchErr } = await supabaseAdmin
            .from('access_requests')
            .select('*, documents (id, title)') // Ensure we fetch document for email
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
            .eq('status', 'pending')
            .select('*, documents (id, title)') // Re-select for email context
            .single();

        if (processErr) throw processErr;
        if (!updatedRequest) {
            results.errors.push({ id: requestId, error: 'Failed to update or request was not pending.' });
            continue;
        }
        
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'ACCESS_REQUEST_PROCESSED',
            p_entity_type: 'access_request',
            p_entity_id: requestId,
            p_details: { 
                decision: decision.status,
                processed_by: processingUserId,
                rejection_reason: decision.rejectionReason,
                previous_status: 'pending',
                bulk_operation: true
            }
        });

        await this.sendDecisionNotificationEmail(updatedRequest as AccessRequest & { documents: DocumentForAccessRequest | null });
        results.processed++;

      } catch (error) {
        results.errors.push({ id: requestId, error: error instanceof Error ? error.message : String(error) });
      }
    }

    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'BULK_ACCESS_REQUEST_PROCESSING_COMPLETED',
      p_entity_type: 'system_task',
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
    requesterEmail: string
  ): Promise<void> {
    return withMonitoring('cancel', 'access_requests', async () => {
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('access_requests')
        .select('id, status, requester_email, document_id, documents (id, title)') // Fetch document for email
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        throw new Error('Access request not found.');
      }
      const typedRequest = request as any;

      if (typedRequest.requester_email.toLowerCase() !== requesterEmail.toLowerCase()) {
        throw new Error('Unauthorized: You can only cancel your own requests.');
      }

      if (typedRequest.status !== 'pending') {
        throw new Error('Cannot cancel a request that has already been processed.');
      }

      const { error: updateError } = await supabaseAdmin
        .from('access_requests')
        .update({
          status: 'rejected',
          rejection_reason: 'Cancelled by requester.',
          processed_at: new Date().toISOString(),
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
      // Optionally, send a cancellation confirmation email, though typically not done.
    });
  }
}

export const accessRequestService = new AccessRequestService();