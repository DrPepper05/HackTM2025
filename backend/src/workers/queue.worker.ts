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

        case 'OCR_PROCESSING':
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
      const shouldRetry = task.attempts < maxAttempts

      if (shouldRetry) {
        // Calculate exponential backoff delay (in seconds)
        const delay = Math.min(300, Math.pow(2, task.attempts) * 30) // Max 5 minutes

        console.log(`Retrying task ${task.id} in ${delay} seconds (attempt ${task.attempts + 1}/${maxAttempts})`)

        await queueService.retryTask(task.id, delay)
      } else {
        // Mark as permanently failed
        await queueService.completeTask(task.id, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        console.log(`Task ${task.id} permanently failed after ${task.attempts} attempts`)
      }
    }
  }

  /**
   * Process document enrichment task
   */
  private async processDocumentEnrichment(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as any
    const { documentId } = payload

    if (!documentId) {
      throw new Error('Document ID is required for enrichment')
    }

    // Run all enrichment processes
    const results = await enrichmentService.enrichDocument(documentId)

    return {
      documentId,
      enrichmentResults: results,
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Process OCR task
   */
  private async processOCR(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as any
    const { documentId, fileKey, language = 'ro' } = payload

    if (!documentId || !fileKey) {
      throw new Error('Document ID and file key are required for OCR')
    }

    // For now, we'll use the enrichment service's processFile functionality
    // In a real implementation, this might be a separate OCR service
    const enrichmentResult = await enrichmentService.processFile(documentId, fileKey)

    return {
      documentId,
      fileKey,
      ocrResult: {
        text: enrichmentResult.extractedText,
        confidence: enrichmentResult.confidence
      },
      language,
      processedAt: new Date().toISOString()
    }
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
    const payload = task.payload as any
    const { documentId, redactionRules } = payload

    if (!documentId) {
      throw new Error('Document ID is required for redaction')
    }

    // For now, we'll simulate redaction
    console.log(`Performing redaction on document ${documentId} with rules:`, redactionRules)

    return {
      documentId,
      redactionResult: { status: 'completed', rulesApplied: redactionRules || [] },
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Process transfer preparation task
   */
  private async processTransferPrep(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as any
    const { documentId, reason } = payload

    if (!documentId) {
      throw new Error('Document ID is required for transfer preparation')
    }

    // This would implement the actual transfer preparation logic
    // For now, we'll just mark it as prepared
    console.log(`Preparing document ${documentId} for transfer: ${reason}`)

    return {
      documentId,
      reason,
      status: 'prepared',
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean
    pollInterval: number
    uptime?: number
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
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping queue worker...')
  queueWorker.stop()
  process.exit(0)
}) 