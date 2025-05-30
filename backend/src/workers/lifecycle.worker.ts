import { lifecycleService } from '../services/lifecycle.service'
import { queueService } from '../services/queue.service'
import { supabaseAdmin } from '../config/supabase.config'

export interface LifecycleWorkerConfig {
  checkInterval: number // milliseconds
  batchSize: number
  enableAutoTransfer: boolean
  enableAutoDestruction: boolean
  enableAutoReview: boolean
}

export class LifecycleWorker {
  private isRunning = false
  private intervalId?: NodeJS.Timeout
  private config: LifecycleWorkerConfig

  constructor(config: Partial<LifecycleWorkerConfig> = {}) {
    this.config = {
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours by default
      batchSize: 100,
      enableAutoTransfer: true,
      enableAutoDestruction: false, // Requires manual approval by default
      enableAutoReview: true,
      ...config
    }
  }

  /**
   * Start the lifecycle worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Lifecycle worker is already running')
      return
    }

    this.isRunning = true
    console.log('Starting lifecycle worker with config:', this.config)

    // Run lifecycle check immediately
    await this.performLifecycleCheck()

    // Schedule periodic checks
    this.intervalId = setInterval(async () => {
      await this.performLifecycleCheck()
    }, this.config.checkInterval)

    console.log(`Lifecycle worker started with ${this.config.checkInterval}ms check interval`)
  }

  /**
   * Stop the lifecycle worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Lifecycle worker is not running')
      return
    }

    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    console.log('Lifecycle worker stopped')
  }

  /**
   * Perform lifecycle check for all documents
   */
  private async performLifecycleCheck(): Promise<void> {
    if (!this.isRunning) return

    try {
      console.log('Starting lifecycle check...')

      const results = await lifecycleService.checkDocumentLifecycles()

      console.log(`Lifecycle check results:`)
      console.log(`- Documents to transfer: ${results.toTransfer.length}`)
      console.log(`- Documents to destroy: ${results.toDestroy.length}`)
      console.log(`- Documents pending review: ${results.pendingReview.length}`)

      // Process transfer requests
      if (this.config.enableAutoTransfer && results.toTransfer.length > 0) {
        await this.processTransferRequests(results.toTransfer)
      }

      // Process destruction requests (typically requires manual approval)
      if (this.config.enableAutoDestruction && results.toDestroy.length > 0) {
        await this.processDestructionRequests(results.toDestroy)
      } else if (results.toDestroy.length > 0) {
        await this.queueDestructionForApproval(results.toDestroy)
      }

      // Mark documents for review
      if (this.config.enableAutoReview && results.pendingReview.length > 0) {
        await this.processReviewRequests(results.pendingReview)
      }

      // Log lifecycle check completion
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'LIFECYCLE_CHECK_COMPLETED',
        p_entity_type: 'lifecycle_worker',
        p_entity_id: null,
        p_details: {
          total_documents_checked: results.toTransfer.length + results.toDestroy.length + results.pendingReview.length,
          transfer_count: results.toTransfer.length,
          destroy_count: results.toDestroy.length,
          review_count: results.pendingReview.length,
          timestamp: new Date().toISOString()
        }
      })

      console.log('Lifecycle check completed successfully')

    } catch (error) {
      console.error('Error during lifecycle check:', error)
      
      // Log the error
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'LIFECYCLE_WORKER_ERROR',
        p_entity_type: 'lifecycle_worker',
        p_entity_id: null,
        p_details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  /**
   * Process transfer requests for documents
   */
  private async processTransferRequests(documents: any[]): Promise<void> {
    console.log(`Processing ${documents.length} documents for transfer...`)

    for (const document of documents) {
      try {
        await lifecycleService.queueForTransfer(
          document.id, 
          'Automatic transfer - retention period expired'
        )

        console.log(`Queued document ${document.id} for transfer`)
      } catch (error) {
        console.error(`Failed to queue document ${document.id} for transfer:`, error)
      }
    }
  }

  /**
   * Process destruction requests for documents
   */
  private async processDestructionRequests(documents: any[]): Promise<void> {
    console.log(`Processing ${documents.length} documents for destruction...`)

    for (const document of documents) {
      try {
        await lifecycleService.scheduleDestruction(
          document.id,
          'Automatic destruction - retention period expired'
        )

        console.log(`Scheduled document ${document.id} for destruction`)
      } catch (error) {
        console.error(`Failed to schedule document ${document.id} for destruction:`, error)
      }
    }
  }

  /**
   * Queue destruction requests for manual approval
   */
  private async queueDestructionForApproval(documents: any[]): Promise<void> {
    console.log(`Queueing ${documents.length} documents for destruction approval...`)

    // In a real system, this would create review tasks for administrators
    for (const document of documents) {
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DESTRUCTION_APPROVAL_REQUIRED',
        p_entity_type: 'document',
        p_entity_id: document.id,
        p_details: {
          document_title: document.title,
          retention_category: document.retention_category,
          creation_date: document.creation_date,
          reason: 'Retention period expired - manual approval required for destruction'
        }
      })
    }
  }

  /**
   * Process review requests for documents
   */
  private async processReviewRequests(documents: any[]): Promise<void> {
    console.log(`Processing ${documents.length} documents for review...`)

    const documentIds = documents.map(doc => doc.id)
    
    try {
      await lifecycleService.markForReview(documentIds)
      console.log(`Marked ${documentIds.length} documents for review`)
    } catch (error) {
      console.error('Failed to mark documents for review:', error)
    }
  }

  /**
   * Run a manual lifecycle check
   */
  async runManualCheck(): Promise<{
    toTransfer: number
    toDestroy: number
    pendingReview: number
  }> {
    console.log('Running manual lifecycle check...')
    
    const results = await lifecycleService.checkDocumentLifecycles()
    
    return {
      toTransfer: results.toTransfer.length,
      toDestroy: results.toDestroy.length,
      pendingReview: results.pendingReview.length
    }
  }

  /**
   * Get documents approaching retention deadline
   */
  async getDocumentsApproachingDeadline(daysAhead: number = 180): Promise<any[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .lte('retention_end_date', futureDate.toISOString())
      .in('status', ['ACTIVE_STORAGE', 'REVIEW'])
      .order('retention_end_date', { ascending: true })

    if (error) throw error

    return documents || []
  }

  /**
   * Generate lifecycle report
   */
  async generateLifecycleReport(): Promise<{
    summary: {
      totalDocuments: number
      approachingDeadline: number
      requiresTransfer: number
      requiresDestruction: number
      underReview: number
    }
    upcomingActions: Array<{
      documentId: string
      title: string
      action: 'transfer' | 'destroy' | 'review'
      deadline: string
      daysUntilDeadline: number
    }>
  }> {
    // Get overall statistics
    const { data: totalDocs } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true })

    const { data: underReview } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'REVIEW')

    // Get documents approaching deadline
    const approachingDocuments = await this.getDocumentsApproachingDeadline(180)

    // Run lifecycle check to get current requirements
    const lifecycleResults = await lifecycleService.checkDocumentLifecycles()

    // Build upcoming actions
    const upcomingActions = approachingDocuments.map(doc => {
      const retentionEndDate = new Date(doc.retention_end_date)
      const now = new Date()
      const daysUntilDeadline = Math.ceil((retentionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      let action: 'transfer' | 'destroy' | 'review'
      if (doc.retention_category === 'permanent') {
        action = 'transfer'
      } else if (daysUntilDeadline <= 0) {
        action = 'destroy'
      } else {
        action = 'review'
      }

      return {
        documentId: doc.id,
        title: doc.title,
        action,
        deadline: doc.retention_end_date,
        daysUntilDeadline
      }
    })

    return {
      summary: {
        totalDocuments: totalDocs?.length || 0,
        approachingDeadline: approachingDocuments.length,
        requiresTransfer: lifecycleResults.toTransfer.length,
        requiresDestruction: lifecycleResults.toDestroy.length,
        underReview: underReview?.length || 0
      },
      upcomingActions: upcomingActions.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)
    }
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean
    config: LifecycleWorkerConfig
    nextCheck?: Date
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      nextCheck: this.intervalId ? new Date(Date.now() + this.config.checkInterval) : undefined
    }
  }

  /**
   * Update worker configuration
   */
  updateConfig(newConfig: Partial<LifecycleWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Lifecycle worker config updated:', this.config)

    // Restart with new interval if running
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }
}

// Create and export a singleton instance
export const lifecycleWorker = new LifecycleWorker()

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping lifecycle worker...')
  lifecycleWorker.stop()
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping lifecycle worker...')
  lifecycleWorker.stop()
}) 