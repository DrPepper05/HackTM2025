import { supabaseAdmin, withMonitoring } from '../config/supabase.config'
import { Document, DocumentStatus } from '../types/database.types'
import { queueService } from './queue.service'

export interface LifecycleAction {
  documentId: string
  action: 'TRANSFER' | 'DESTROY' | 'EXTEND_RETENTION'
  scheduledDate: Date
  reason?: string
}

export class LifecycleService {
  /**
   * Check documents for lifecycle actions
   */
  async checkDocumentLifecycles(): Promise<{
    toTransfer: Document[]
    toDestroy: Document[]
    pendingReview: Document[]
  }> {
    return withMonitoring('lifecycle_check', 'documents', async () => {
      const now = new Date()
      
      // Get documents that may need lifecycle actions
      const { data: documents, error } = await supabaseAdmin
        .from('documents')
        .select('*')
        .in('status', ['ACTIVE_STORAGE', 'REVIEW'])

      if (error) throw error

      const result = {
        toTransfer: [] as Document[],
        toDestroy: [] as Document[],
        pendingReview: [] as Document[]
      }

      documents?.forEach(doc => {
        if (!doc.creation_date) return

        const creationDate = new Date(doc.creation_date)
        const retentionPeriod = this.getRetentionPeriodYears(doc.retention_category)
        const retentionEndDate = new Date(creationDate)
        retentionEndDate.setFullYear(retentionEndDate.getFullYear() + retentionPeriod)

        // Check if retention period has expired
        if (now >= retentionEndDate) {
          if (doc.retention_category === 'permanent') {
            result.toTransfer.push(doc)
          } else {
            result.toDestroy.push(doc)
          }
        } else {
          // Check if approaching retention (6 months before)
          const reviewDate = new Date(retentionEndDate)
          reviewDate.setMonth(reviewDate.getMonth() - 6)
          
          if (now >= reviewDate && doc.status === 'ACTIVE_STORAGE') {
            result.pendingReview.push(doc)
          }
        }
      })

      return result
    })
  }

  /**
   * Queue document for transfer to National Archives
   */
  async queueForTransfer(documentId: string, reason?: string): Promise<void> {
    return withMonitoring('queue_transfer', 'documents', async () => {
      // Update document status
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'AWAITING_TRANSFER',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      // Queue transfer task
      await queueService.enqueueTask({
        type: 'TRANSFER_PREP',
        payload: { documentId, reason },
        priority: 3
      })

      // Log action
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_QUEUED_FOR_TRANSFER',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: { reason }
      })
    })
  }

  /**
   * Schedule document for destruction
   */
  async scheduleDestruction(documentId: string, reason: string): Promise<void> {
    return withMonitoring('schedule_destruction', 'documents', async () => {
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'DESTROY',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_SCHEDULED_FOR_DESTRUCTION',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: { reason }
      })
    })
  }

  /**
   * Mark documents for review when approaching retention
   */
  async markForReview(documentIds: string[]): Promise<void> {
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'REVIEW',
        updated_at: new Date().toISOString()
      })
      .in('id', documentIds)

    // Log batch review marking
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'DOCUMENTS_MARKED_FOR_REVIEW',
      p_entity_type: 'document',
      p_entity_id: null,
      p_details: {
        document_count: documentIds.length,
        document_ids: documentIds
      }
    })
  }

  private getRetentionPeriodYears(category: string | null): number {
    switch (category) {
      case 'permanent': return 999 // Effectively permanent
      case '30y': return 30
      case '10y': return 10
      case '5y': return 5
      case '3y': return 3
      default: return 10 // Default
    }
  }
}

export const lifecycleService = new LifecycleService() 