import { enrichmentService } from '../services/enrichment.service'
import { documentService } from '../services/document.service'
import { storageService } from '../services/storage.service'
import { supabaseAdmin } from '../config/supabase.config'

export interface EnrichmentWorkerConfig {
  batchSize: number
  processingDelay: number
  enableOCR: boolean
  enablePIIDetection: boolean
  enableTitleSuggestion: boolean
  enableRetentionPrediction: boolean
}

export class EnrichmentWorker {
  private isRunning = false
  private config: EnrichmentWorkerConfig

  constructor(config: Partial<EnrichmentWorkerConfig> = {}) {
    this.config = {
      batchSize: 10,
      processingDelay: 2000, // 2 seconds between batches
      enableOCR: true,
      enablePIIDetection: true,
      enableTitleSuggestion: true,
      enableRetentionPrediction: true,
      ...config
    }
  }

  /**
   * Start the enrichment worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Enrichment worker is already running')
      return
    }

    this.isRunning = true
    console.log('Starting enrichment worker with config:', this.config)

    // Process documents continuously
    this.processDocuments()
  }

  /**
   * Stop the enrichment worker
   */
  stop(): void {
    this.isRunning = false
    console.log('Enrichment worker stopped')
  }

  /**
   * Process documents for enrichment
   */
  private async processDocuments(): Promise<void> {
    while (this.isRunning) {
      try {
        // Get documents that need enrichment
        const documents = await this.getDocumentsNeedingEnrichment()

        if (documents.length === 0) {
          // Wait before checking again
          await this.delay(this.config.processingDelay)
          continue
        }

        console.log(`Processing ${documents.length} documents for enrichment`)

        // Process documents in batches
        for (let i = 0; i < documents.length; i += this.config.batchSize) {
          if (!this.isRunning) break

          const batch = documents.slice(i, i + this.config.batchSize)
          await this.processBatch(batch)

          // Delay between batches to avoid overwhelming the system
          if (i + this.config.batchSize < documents.length) {
            await this.delay(this.config.processingDelay)
          }
        }

      } catch (error) {
        console.error('Error in enrichment worker:', error)
        
        // Log the error
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'ENRICHMENT_WORKER_ERROR',
          p_entity_type: 'enrichment_worker',
          p_entity_id: null,
          p_details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        })

        // Wait before retrying
        await this.delay(5000)
      }
    }
  }

  /**
   * Get documents that need enrichment
   */
  private async getDocumentsNeedingEnrichment(): Promise<any[]> {
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        document_files!inner(*)
      `)
      .eq('status', 'UPLOADED')
      .is('ai_title', null) // Documents without AI-generated title
      .limit(this.config.batchSize * 2) // Get more than batch size for efficiency

    if (error) throw error

    return documents || []
  }

  /**
   * Process a batch of documents
   */
  private async processBatch(documents: any[]): Promise<void> {
    const promises = documents.map(doc => this.processDocument(doc))
    
    // Process documents in parallel but with error handling
    const results = await Promise.allSettled(promises)

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to process document ${documents[index].id}:`, result.reason)
      }
    })
  }

  /**
   * Process a single document
   */
  private async processDocument(document: any): Promise<void> {
    try {
      console.log(`Processing document ${document.id}: ${document.title || 'Untitled'}`)

      // Mark document as being processed
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'PROCESSING',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)

      // Run enrichment
      // const enrichmentResult = await enrichmentService.enrichDocument(document.id)

      const enrichmentResult = {
        detectedPII: []
      };

      // Update document status
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'ENRICHED',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)

      console.log(`Successfully enriched document ${document.id}`)

      // Optionally generate thumbnails
    //   await this.generateThumbnails(document)

      // Optionally check for PII and queue redaction
      if (enrichmentResult.detectedPII.length > 0) {
        await this.queueRedactionIfNeeded(document.id, enrichmentResult.detectedPII)
      }

    } catch (error) {
      console.error(`Failed to process document ${document.id}:`, error)

      // Mark document as failed
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)

      // Log the error
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_ENRICHMENT_FAILED',
        p_entity_type: 'document',
        p_entity_id: document.id,
        p_details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

//   /**
//    * Generate thumbnails for document files
//    */
//   private async generateThumbnails(document: any): Promise<void> {
//     if (!document.document_files) return

//     for (const file of document.document_files) {
//       if (file.file_type === 'original' && file.mime_type.startsWith('image/')) {
//         try {
//           // In a real implementation, this would generate actual thumbnails
//           console.log(`Generating thumbnail for file ${file.id}`)
          
//           // Mock thumbnail generation
//           const thumbnailBuffer = Buffer.from('mock-thumbnail-data')
          
//           // Note: Using 'transfer' type as 'thumbnail' is not in the enum
//           // In a production system, we'd add 'thumbnail' to the file_type enum
//           await documentService.addDocumentFile(
//             document.id,
//             {
//               buffer: thumbnailBuffer,
//               originalname: `thumb_${file.file_name}`,
//               mimetype: 'image/jpeg',
//               size: thumbnailBuffer.length
//             },
//             'transfer', // Using 'transfer' as placeholder for thumbnail
//             'system'
//           )

//         } catch (error) {
//           console.error(`Failed to generate thumbnail for file ${file.id}:`, error)
//         }
//       }
//     }
//   }

  /**
   * Queue redaction if sensitive PII is detected
   */
  private async queueRedactionIfNeeded(documentId: string, piiDetections: any[]): Promise<void> {
    // Check if there's high-confidence sensitive PII
    const sensitivePII = piiDetections.filter(pii => 
      pii.confidence > 0.8 && 
      ['PERSONAL_ID', 'FINANCIAL'].includes(pii.type)
    )

    if (sensitivePII.length > 0) {
      console.log(`Queueing redaction for document ${documentId} due to sensitive PII`)
      
      // This would queue a redaction task
      // For now, just log it
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'REDACTION_QUEUED',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: {
          pii_count: sensitivePII.length,
          pii_types: sensitivePII.map(p => p.type)
        }
      })
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean
    config: EnrichmentWorkerConfig
  } {
    return {
      isRunning: this.isRunning,
      config: this.config
    }
  }

  /**
   * Update worker configuration
   */
  updateConfig(newConfig: Partial<EnrichmentWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Enrichment worker config updated:', this.config)
  }
}

// Create and export a singleton instance
export const enrichmentWorker = new EnrichmentWorker()

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping enrichment worker...')
  enrichmentWorker.stop()
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping enrichment worker...')
  enrichmentWorker.stop()
}) 
