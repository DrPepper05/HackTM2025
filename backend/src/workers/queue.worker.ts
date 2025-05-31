import { queueService } from '../services/queue.service'
import { enrichmentService } from '../services/enrichment.service'
import { lifecycleService } from '../services/lifecycle.service'
import { supabaseAdmin } from '../config/supabase.config'
import { ProcessingQueueTask } from '../types/database.types'

export class QueueWorker {
  private isRunning = false
  private intervalId?: NodeJS.Timeout
  private readonly pollInterval: number

  constructor(pollInterval: number = 5000) { // Poll every 5 seconds
    this.pollInterval = pollInterval
  }

  /**
   * Start the queue worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Queue worker is already running')
      return
    }

    this.isRunning = true
    console.log('Starting queue worker...')

    // Start polling for tasks
    this.intervalId = setInterval(async () => {
      await this.processPendingTasks()
    }, this.pollInterval)

    // Process any existing tasks immediately
    await this.processPendingTasks()

    console.log(`Queue worker started with ${this.pollInterval}ms poll interval`)
  }

  /**
   * Stop the queue worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Queue worker is not running')
      return
    }

    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    console.log('Queue worker stopped')
  }

  /**
   * Process pending tasks from the queue
   */
  private async processPendingTasks(): Promise<void> {
    if (!this.isRunning) return

    try {
      // Get pending tasks (limit to 5 at a time to avoid overwhelming)
      const tasks = await queueService.getPendingTasks(undefined, 5)

      if (tasks.length === 0) {
        // No tasks to process
        return
      }

      console.log(`Processing ${tasks.length} pending tasks`)

      // Process each task
      for (const task of tasks) {
        if (!this.isRunning) break // Stop if worker was stopped

        await this.processTask(task)
      }
    } catch (error) {
      console.error('Error processing pending tasks:', error)
      
      // Log the error
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'QUEUE_WORKER_ERROR',
        p_entity_type: 'queue_worker',
        p_entity_id: null,
        p_details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: ProcessingQueueTask): Promise<void> {
    console.log(`Processing task ${task.id} of type ${task.task_type}`)

    try {
      // Mark task as processing
      await queueService.markTaskProcessing(task.id)

      let result: any

      // Route task to appropriate processor
      switch (task.task_type) {
        case 'DOCUMENT_ENRICHMENT':
          result = await this.processDocumentEnrichment(task)
          break

        case 'OCR_PROCESSING': // This case was updated in a previous step
          result = await this.processOCR(task)
          break

        case 'LIFECYCLE_CHECK':
          result = await this.processLifecycleCheck(task)
          break

        case 'REDACTION':
          result = await this.processRedaction(task)
          break

        case 'TRANSFER_PREP':
          result = await this.processTransferPrep(task)
          break

        default:
          throw new Error(`Unknown task type: ${task.task_type}`)
      }

      // Mark task as completed
      await queueService.completeTask(task.id, {
        success: true,
        result
      })

      console.log(`Task ${task.id} completed successfully`)

    } catch (error) {
      console.error(`Task ${task.id} failed:`, error)

      // Check if we should retry
      const maxAttempts = task.max_attempts || 3
      const shouldRetry = task.attempts < maxAttempts // task.attempts is from the DB record

      if (shouldRetry) {
        // Calculate exponential backoff delay (in seconds)
        // Ensure task.attempts is a number before using in Math.pow
        const currentAttempts = typeof task.attempts === 'number' ? task.attempts : 0;
        const delay = Math.min(300, Math.pow(2, currentAttempts) * 30) // Max 5 minutes

        console.log(`Retrying task ${task.id} in ${delay} seconds (attempt ${currentAttempts + 1}/${maxAttempts})`)

        await queueService.retryTask(task.id, delay)
      } else {
        // Mark as permanently failed
        await queueService.completeTask(task.id, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        const finalAttempts = typeof task.attempts === 'number' ? task.attempts : 'unknown';
        console.log(`Task ${task.id} permanently failed after ${finalAttempts} attempts`)
      }
    }
  }

  /**
   * Process document enrichment task
   */
  private async processDocumentEnrichment(task: ProcessingQueueTask): Promise<any> {
    // Cast payload to a more specific type for better type safety if you know its structure.
    // For now, we'll assert the specific property we need.
    const payload = task.payload as { document_id?: string; [key: string]: any };
    
    // FIX: Correctly destructure document_id and rename it to documentId
    const documentId = payload.document_id; 

    if (!documentId) { // This check should now pass if document_id exists in the payload
      console.error('Task payload missing document_id:', JSON.stringify(payload));
      throw new Error('Document ID (document_id) is required in the task payload for enrichment');
    }

    console.log(`[QueueWorker] Starting enrichment for documentId: ${documentId}`);
    // Run all enrichment processes
    const results = await enrichmentService.enrichDocument(documentId);

    return {
      documentId,
      enrichmentResults: results,
      processedAt: new Date().toISOString()
    };
  }


  /**
   * Process OCR task
   */
  private async processOCR(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as any; // Consider defining a type for this payload
    const { documentId } = payload;

    if (!documentId) {
      throw new Error('Document ID is required for OCR processing');
    }

    // The main enrichment process now includes OCR.
    // We will call the same function as the DOCUMENT_ENRICHMENT task.
    console.log(`Forwarding OCR_PROCESSING task for document ${documentId} to the main enrichment service.`);
    const results = await enrichmentService.enrichDocument(documentId);

    return {
      documentId,
      ocrResult: {
        text: results.extractedText,
        confidence: results.confidence, // This confidence is for the whole enrichment result
      },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Process lifecycle check task
   */
  private async processLifecycleCheck(task: ProcessingQueueTask): Promise<any> {
    const results = await lifecycleService.checkDocumentLifecycles()

    // Queue documents for transfer if needed
    for (const doc of results.toTransfer) {
      await lifecycleService.queueForTransfer(doc.id, 'Retention period expired')
    }

    // Schedule documents for destruction if needed
    for (const doc of results.toDestroy) {
      await lifecycleService.scheduleDestruction(doc.id, 'Retention period expired')
    }

    // Mark documents for review if needed
    if (results.pendingReview.length > 0) {
      await lifecycleService.markForReview(results.pendingReview.map(doc => doc.id))
    }

    return {
      toTransfer: results.toTransfer.length,
      toDestroy: results.toDestroy.length,
      pendingReview: results.pendingReview.length,
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Process redaction task
   */
  private async processRedaction(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as any // Consider defining a type for this payload
    const { documentId, redactionRules } = payload

    if (!documentId) {
      throw new Error('Document ID is required for redaction')
    }

    // This would implement the actual redaction logic using enrichmentService.generateRedactedVersion
    console.log(`Performing redaction on document ${documentId} with rules:`, redactionRules)
    // Example: await enrichmentService.generateRedactedVersion(documentId, redactionRules);

    return {
      documentId,
      redactionResult: { status: 'completed_mock', rulesApplied: redactionRules || [] },
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Process transfer preparation task
   */
  private async processTransferPrep(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as any // Consider defining a type for this payload
    const { documentId, reason } = payload

    if (!documentId) {
      throw new Error('Document ID is required for transfer preparation')
    }

    // This would implement the actual transfer preparation logic
    // e.g., generating BagIt packages, metadata files for National Archives
    console.log(`Preparing document ${documentId} for transfer: ${reason}`)

    return {
      documentId,
      reason,
      status: 'prepared_mock', // Placeholder status
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean
    pollInterval: number
    uptime?: number // Uptime could be added if needed
  } {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval
    }
  }
}

// Create and export a singleton instance
export const queueWorker = new QueueWorker()

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping queue worker...')
  queueWorker.stop()
  process.exit(0) // Exit after stopping
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping queue worker...')
  queueWorker.stop()
  process.exit(0) // Exit after stopping
}) 

// Actually start the worker when this script is run directly
queueWorker.start().catch(error => {
  console.error('Failed to start queue worker:', error);
  process.exit(1); // Exit if start fails
});