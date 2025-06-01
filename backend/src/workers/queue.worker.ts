// backend/src/workers/queue.worker.ts
import { queueService } from '../services/queue.service';
import { enrichmentService, TEXT_FILE_PROCESSED_DIRECTLY_SIGNAL } from '../services/enrichment.service'; // Import the signal
import { documentService } from '../services/document.service'; // Added for fetching document/text
import { storageService } from '../services/storage.service'; // Added for fetching document/text
import { lifecycleService } from '../services/lifecycle.service';
import { supabaseAdmin } from '../config/supabase.config';
import { ProcessingQueueTask, Document, DocumentFile } from '../types/database.types';

// Define DocumentWithFiles type
type DocumentWithFiles = Document & {
  document_files?: DocumentFile[];
};

export class QueueWorker {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private readonly pollInterval: number;

  constructor(pollInterval: number = 5000) { // Poll every 5 seconds
    this.pollInterval = pollInterval;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Queue worker is already running');
      return;
    }
    this.isRunning = true;
    console.log('Starting queue worker...');
    this.intervalId = setInterval(async () => {
      await this.processPendingTasks();
    }, this.pollInterval);
    await this.processPendingTasks(); // Process immediately on start
    console.log(`Queue worker started with ${this.pollInterval}ms poll interval`);
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Queue worker is not running');
      return;
    }
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Queue worker stopped');
  }

  private async processPendingTasks(): Promise<void> {
    if (!this.isRunning) return;
    try {
      const tasks = await queueService.getPendingTasks(undefined, 5); // Fetch 5 tasks at a time
      if (tasks.length === 0) return;

      console.log(`Processing ${tasks.length} pending tasks`);
      for (const task of tasks) {
        if (!this.isRunning) break;
        await this.processTask(task);
      }
    } catch (error) {
      console.error('Error processing pending tasks:', error);
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'QUEUE_WORKER_ERROR',
        p_entity_type: 'queue_worker',
        p_entity_id: null,
        p_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private async processTask(task: ProcessingQueueTask): Promise<void> {
    console.log(`Processing task ${task.id} of type ${task.task_type}`);
    try {
      await queueService.markTaskProcessing(task.id);
      let result: any;
      let shouldComplete = true; // Flag to determine if task should be marked completed by default

      const payload = task.payload as any; // General payload type
      const documentId = payload.documentId || payload.document_id; // Handle both conventions

      switch (task.task_type) {
        case 'DOCUMENT_ENRICHMENT':
          if (!documentId) throw new Error('Document ID missing for DOCUMENT_ENRICHMENT task');
          const jobSignal = await enrichmentService.startDocumentAnalysis(documentId);
          if (jobSignal && jobSignal !== TEXT_FILE_PROCESSED_DIRECTLY_SIGNAL) {
            await queueService.enqueueTask({
              type: 'POLL_TEXTRACT_JOB',
              payload: { documentId, jobId: jobSignal },
              priority: task.priority,
            });
            console.log(`[QueueWorker] Textract job ${jobSignal} for doc ${documentId} queued for polling.`);
            result = { message: `Textract job started for document ${documentId}.`, jobId: jobSignal };
          } else if (jobSignal === TEXT_FILE_PROCESSED_DIRECTLY_SIGNAL) {
            // 'PROCESS_TEXT_FOR_AI' task was already enqueued by startDocumentAnalysis
            console.log(`[QueueWorker] Plain text file ${documentId} handled directly, AI analysis task already queued by service.`);
            result = { message: `Plain text file ${documentId} handled directly, AI analysis task queued.` };
          }
          break;

        case 'POLL_TEXTRACT_JOB':
          const pollPayload = payload as { documentId?: string, jobId?: string };
          const { documentId: docIdPoll, jobId: textractJobId } = pollPayload;
          if (!docIdPoll || !textractJobId) throw new Error('documentId and jobId are required for polling Textract');

          console.log(`[QueueWorker] Polling Textract job ${textractJobId} for document ${docIdPoll}`);
          const pollTextractRes = await enrichmentService.processTextractResult(docIdPoll, textractJobId);

          if (pollTextractRes.needsRetry) {
            await queueService.retryTask(task.id, 60); // Retry after 60 seconds
            shouldComplete = false; // Task is not finished, re-queue for later
            result = { success: false, message: "Textract still in progress" };
          } else {
            // If needsRetry is false, processTextractResult has saved OCR text
            // and enqueued the 'PROCESS_TEXT_FOR_AI' task.
            result = { success: true, message: "Textract completed, AI processing task queued." };
          }
          break;

        case 'PROCESS_TEXT_FOR_AI': // New task type
          if (!documentId) throw new Error('Document ID missing for PROCESS_TEXT_FOR_AI task');
          console.log(`[QueueWorker] Starting AI analysis for document ${documentId}`);

          const docForAi = await documentService.getDocumentById(documentId) as DocumentWithFiles | null;
          if (!docForAi) throw new Error(`Document ${documentId} not found for AI processing.`);

          // Find the file that contains the text (either original plain text or OCRed text)
          let textToAnalyze: string | null = null;
          const originalTextFile = docForAi.document_files?.find(f => f.file_type === 'original' && f.mime_type === 'text/plain');
          const ocrFile = docForAi.document_files?.find(f => f.ocr_text); // A file that has OCR text

          if (originalTextFile && originalTextFile.ocr_text) { // Text from plain file might be stored in ocr_text by startDocumentAnalysis
             textToAnalyze = originalTextFile.ocr_text;
          } else if (ocrFile && ocrFile.ocr_text) {
             textToAnalyze = ocrFile.ocr_text;
          } else if (originalTextFile) { // If ocr_text is not populated for plain text for some reason, try fetching directly
            console.warn(`[QueueWorker] OCR text missing for plain text file ${originalTextFile.id} for doc ${documentId}, attempting re-fetch from storage.`);
            const fileData = await storageService.downloadFile(originalTextFile.storage_bucket, originalTextFile.storage_key);
            textToAnalyze = fileData.data.toString('utf-8');
          }

          if (!textToAnalyze) {
            throw new Error(`No text content found for document ${documentId} to perform AI analysis.`);
          }
          result = await enrichmentService.performAiAnalysisAndUpdateDb(documentId, textToAnalyze);
          break;

        case 'LIFECYCLE_CHECK':
          result = await this.processLifecycleCheck(task);
          break;

        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }

      if (shouldComplete) {
        await queueService.completeTask(task.id, { success: true, result });
        console.log(`Task ${task.id} (type: ${task.task_type}) completed successfully.`);
      }

    } catch (error) {
      console.error(`Task ${task.id} (type: ${task.task_type}) failed:`, error);
      const maxAttempts = task.max_attempts || 3;
      const shouldRetry = task.attempts < maxAttempts;

      if (shouldRetry) {
        const delaySeconds = Math.min(300, Math.pow(2, task.attempts) * 30); // Exponential backoff up to 5 mins
        console.log(`Retrying task ${task.id} in ${delaySeconds} seconds (attempt ${task.attempts + 1}/${maxAttempts})`);
        await queueService.retryTask(task.id, delaySeconds);
      } else {
        await queueService.completeTask(task.id, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.log(`Task ${task.id} permanently failed after ${task.attempts} attempts.`);
        // Log error to document metadata as well
         const documentIdForError = (task.payload as any)?.documentId || (task.payload as any)?.document_id;
         if (documentIdForError) {
            await enrichmentService.performAiAnalysisAndUpdateDb(documentIdForError, `Enrichment failed: ${error instanceof Error ? error.message : String(error)}`).catch(e => console.error("Failed to update document with error state:", e));
         }
      }
    }
  }

  private async processLifecycleCheck(task: ProcessingQueueTask): Promise<any> {
    const results = await lifecycleService.checkDocumentLifecycles();
    for (const doc of results.toTransfer) {
      await lifecycleService.queueForTransfer(doc.id, 'Retention period expired');
    }
    for (const doc of results.toDestroy) {
      await lifecycleService.scheduleDestruction(doc.id, 'Retention period expired');
    }
    if (results.pendingReview.length > 0) {
      await lifecycleService.markForReview(results.pendingReview.map(doc => doc.id));
    }
    return {
      toTransfer: results.toTransfer.length,
      toDestroy: results.toDestroy.length,
      pendingReview: results.pendingReview.length,
    };
  }
}

// Create and export a singleton instance
export const queueWorker = new QueueWorker();

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping queue worker...');
  queueWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping queue worker...');
  queueWorker.stop();
  process.exit(0);
});

// Start the worker if this script is run directly
if (require.main === module) {
    queueWorker.start().catch(error => {
        console.error('Failed to start queue worker:', error);
        process.exit(1);
    });
}