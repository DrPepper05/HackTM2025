// backend/src/workers/queue.worker.ts
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
      const tasks = await queueService.getPendingTasks(undefined, 5)
      if (tasks.length === 0) return

      console.log(`Processing ${tasks.length} pending tasks`)

      for (const task of tasks) {
        if (!this.isRunning) break
        await this.processTask(task)
      }
    } catch (error) {
      console.error('Error processing pending tasks:', error)
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'QUEUE_WORKER_ERROR',
        p_entity_type: 'queue_worker',
        p_entity_id: null,
        p_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: ProcessingQueueTask): Promise<void> {
    console.log(`Processing task ${task.id} of type ${task.task_type}`)
    try {
      await queueService.markTaskProcessing(task.id)

      let result: any;
      let shouldComplete = true; // Flag to determine if task should be marked completed

      switch (task.task_type) {
        case 'DOCUMENT_ENRICHMENT':
          result = await this.processDocumentEnrichment(task);
          break;
        
        case 'POLL_TEXTRACT_JOB':
          const pollResult = await this.pollTextractJob(task);
          if (pollResult.needsRetry) {
            // Task is not finished, re-queue for later instead of completing.
            await queueService.retryTask(task.id, 60); // Retry after 60 seconds
            shouldComplete = false;
          }
          result = pollResult;
          break;
          
        case 'LIFECYCLE_CHECK':
          result = await this.processLifecycleCheck(task)
          break

        // ... other cases remain the same
        default:
          throw new Error(`Unknown task type: ${task.task_type}`)
      }

      if (shouldComplete) {
        await queueService.completeTask(task.id, { success: true, result });
        console.log(`Task ${task.id} completed successfully`);
      }

    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      const maxAttempts = task.max_attempts || 3
      const shouldRetry = task.attempts < maxAttempts

      if (shouldRetry) {
        const delay = Math.min(300, Math.pow(2, task.attempts) * 30);
        console.log(`Retrying task ${task.id} in ${delay} seconds`);
        await queueService.retryTask(task.id, delay);
      } else {
        await queueService.completeTask(task.id, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.log(`Task ${task.id} permanently failed after ${task.attempts} attempts`);
      }
    }
  }

  /**
   * Step 1: Start the enrichment process by creating a Textract job.
   */
  private async processDocumentEnrichment(task: ProcessingQueueTask): Promise<any> {
    const payload = task.payload as { document_id?: string; [key: string]: any };
    const documentId = payload.document_id;
    if (!documentId) throw new Error('Document ID is required for enrichment');

    console.log(`[QueueWorker] Starting enrichment for documentId: ${documentId}`);
    const jobId = await enrichmentService.startDocumentAnalysis(documentId);

    // Now that the job is started, queue the polling task
    await queueService.enqueueTask({
      type: 'POLL_TEXTRACT_JOB',
      payload: { documentId, jobId },
      priority: task.priority, // Keep the same priority
    });

    return {
      message: `Textract job started for document ${documentId}.`,
      jobId,
    };
  }
  
  /**
   * Step 2: Poll the Textract job and finalize enrichment upon completion.
   */
  private async pollTextractJob(task: ProcessingQueueTask): Promise<{ needsRetry: boolean }> {
      const payload = task.payload as { documentId?: string, jobId?: string };
      const { documentId, jobId } = payload;
      if (!documentId || !jobId) throw new Error('documentId and jobId are required for polling');
      
      console.log(`[QueueWorker] Polling Textract job ${jobId} for document ${documentId}`);
      const result = await enrichmentService.processTextractResult(documentId, jobId);

      // The service returns `needsRetry: true` if the job is still IN_PROGRESS
      return 'needsRetry' in result ? { needsRetry: result.needsRetry } : { needsRetry: false };
  }

  /**
   * Process lifecycle check task
   */
  private async processLifecycleCheck(task: ProcessingQueueTask): Promise<any> {
    const results = await lifecycleService.checkDocumentLifecycles()
    for (const doc of results.toTransfer) {
      await lifecycleService.queueForTransfer(doc.id, 'Retention period expired')
    }
    for (const doc of results.toDestroy) {
      await lifecycleService.scheduleDestruction(doc.id, 'Retention period expired')
    }
    if (results.pendingReview.length > 0) {
      await lifecycleService.markForReview(results.pendingReview.map(doc => doc.id))
    }
    return {
      toTransfer: results.toTransfer.length,
      toDestroy: results.toDestroy.length,
      pendingReview: results.pendingReview.length,
    }
  }
  
  // ... other process methods (redaction, transfer prep etc.) would go here
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

// Start the worker if this script is run directly
if (require.main === module) {
    queueWorker.start().catch(error => {
        console.error('Failed to start queue worker:', error);
        process.exit(1);
    });
}