// backend/src/services/enrichment.service.ts
import { supabaseAdmin, withMonitoring } from '../config/supabase.config';
import { documentService } from './document.service';
import { queueService } from './queue.service';
import { Document, DocumentFile, RetentionCategory, Json } from '../types/database.types';
import { storageService, S3_BUCKETS } from './storage.service';

// AWS SDK Imports
import { 
  TextractClient, 
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  JobStatus,
  Block // Import the Block type if not already imported
} from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PDFDocument } from 'pdf-lib';


// Interfaces
export interface EnrichmentResult {
  suggestedTitle?: string;
  predictedRetention?: RetentionCategory;
  detectedPII: PIIDetection[];
  extractedText?: string;
  confidence: number; // This is for AI analysis confidence
  ocrConfidence?: number; // Added for OCR specific confidence
  metadata: Record<string, any>;
}

export interface PIIDetection {
  type: 'PERSONAL_ID' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'NAME' | 'FINANCIAL' | 'ORGANIZATION' | 'DATE' | 'LOCATION' | 'OTHER';
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

type DocumentWithFiles = Document & { document_files?: DocumentFile[]; };

// AWS Clients
const awsRegion = process.env.AWS_REGION || 'eu-central-1';
const textractClient = new TextractClient({ region: awsRegion });
const bedrockClient = new BedrockRuntimeClient({ region: awsRegion });

const RETENTION_CONFIDENCE_THRESHOLD = 0.90;


export class EnrichmentService {
  /**
   * Step 1: Start the Textract analysis job for a document.
   */
  async startDocumentAnalysis(documentId: string): Promise<string> {
    return withMonitoring('start_textract_job', 'documents', async () => {
      const document = (await documentService.getDocumentById(documentId)) as DocumentWithFiles;
      if (!document) throw new Error(`Document not found for ID: ${documentId}`);

      const originalFile = document.document_files?.find(f => f.file_type === 'original');
      if (!originalFile) throw new Error(`Original file not found for document ID: ${documentId}`);
      
      const supportedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!originalFile.mime_type || !supportedMimeTypes.includes(originalFile.mime_type)) {
        const errorMsg = `Unsupported document format for Textract: ${originalFile.mime_type || 'unknown'}.`;
        await this.updateDocumentWithError(documentId, errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`[EnrichmentService] Starting Textract job for document ${documentId}`);

      const command = new StartDocumentAnalysisCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: originalFile.storage_bucket,
            Name: originalFile.storage_key,
          },
        },
        FeatureTypes: ['FORMS', 'TABLES'], // Can also request 'LAYOUT' if needed for other purposes
      });

      const response = await textractClient.send(command);
      if (!response.JobId) {
        throw new Error('Failed to start Textract job, no JobId returned.');
      }

      console.log(`[EnrichmentService] Textract job started successfully for document ${documentId}. JobId: ${response.JobId}`);
      
      await supabaseAdmin.from('documents').update({ 
        metadata: { 
          ...(document.metadata && typeof document.metadata === 'object' ? document.metadata : {}), 
          textractJobId: response.JobId 
        } 
      }).eq('id', documentId);
      
      return response.JobId;
    });
  }

  /**
   * Step 2: Poll for the result of the Textract job and process the final enrichment.
   */
  async processTextractResult(documentId: string, jobId: string): Promise<EnrichmentResult | { needsRetry: boolean }> {
     return withMonitoring('process_textract_result', 'documents', async () => {
        let nextToken: string | undefined;
        let jobStatus: JobStatus | undefined;
        let allBlocks: Block[] = []; // Use the imported Block type

        do {
            const command = new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken });
            const response = await textractClient.send(command);
            
            jobStatus = response.JobStatus;
            
            if (jobStatus === JobStatus.IN_PROGRESS) {
                console.log(`[EnrichmentService] Textract job ${jobId} is still in progress. Retrying...`);
                return { needsRetry: true };
            }
            if (jobStatus === JobStatus.FAILED || jobStatus === JobStatus.PARTIAL_SUCCESS) {
                await this.updateDocumentWithError(documentId, `Textract job failed with status: ${jobStatus}. Reason: ${response.StatusMessage}`);
                throw new Error(`Textract job ${jobId} failed: ${response.StatusMessage}`);
            }

            if (response.Blocks) {
                allBlocks = allBlocks.concat(response.Blocks);
            }
            nextToken = response.NextToken;
        } while (nextToken);

        const lineBlocks = allBlocks.filter(block => block.BlockType === 'LINE');
        const ocrText = lineBlocks.map(block => block.Text || '').join('\n');
        
        // --- START: Calculate Average OCR Confidence ---
        let totalConfidence = 0;
        let lineCount = 0;
        lineBlocks.forEach(block => {
            if (block.Confidence !== undefined) { // Textract confidence is 0-100
                totalConfidence += block.Confidence;
                lineCount++;
            }
        });
        // Normalize to 0-1 if lineCount > 0, else default or handle as appropriate
        const averageOcrConfidence = lineCount > 0 ? (totalConfidence / lineCount) / 100 : 0; 
        // --- END: Calculate Average OCR Confidence ---
        
        const originalFile = (await documentService.getDocumentById(documentId) as DocumentWithFiles)?.document_files?.find(f => f.file_type === 'original');
        if (originalFile) {
            // Pass the calculated confidence to updateOcrResult
            await this.updateOcrResult(originalFile.id, ocrText, averageOcrConfidence);
        }

        const piiDetections: PIIDetection[] = [];
        const aiAnalysis = await this._analyzeTextWithBedrock(ocrText);
        
        const currentDoc = await documentService.getDocumentById(documentId);
        if (!currentDoc) {
            throw new Error(`Document ${documentId} not found during final update.`);
        }
        const existingMetadata = (currentDoc.metadata && typeof currentDoc.metadata === 'object' && !Array.isArray(currentDoc.metadata))
            ? currentDoc.metadata
            : {};

        const updates: Partial<Document> = {
          ai_suggested_title: aiAnalysis.title,
          ai_predicted_retention: aiAnalysis.retention_category as RetentionCategory,
          metadata: {
              ...existingMetadata,
              enrichment_completed_at: new Date().toISOString(),
              enrichment_confidence: aiAnalysis.confidence,
              documentTypeFromAI: aiAnalysis.document_type,
              average_ocr_confidence: averageOcrConfidence // Store average OCR confidence in metadata too
          },
          document_type: currentDoc.document_type || aiAnalysis.document_type
        };
  
        let auditAction: string;
        let auditDetails: any = { 
            provider: 'aws_bedrock_async', 
            ai_confidence: aiAnalysis.confidence, // AI analysis confidence
            ocr_confidence: averageOcrConfidence // OCR confidence
        };
  
        if (aiAnalysis.confidence >= RETENTION_CONFIDENCE_THRESHOLD) {
          updates.retention_category = aiAnalysis.retention_category as RetentionCategory;
          updates.status = 'ACTIVE_STORAGE'; 
          auditAction = 'AUTONOMOUS_CLASSIFICATION_SUCCESS';
          auditDetails.assigned_retention = updates.retention_category;
        } else {
          updates.status = 'NEEDS_CLASSIFICATION'; 
          auditAction = 'AUTONOMOUS_CLASSIFICATION_NEEDS_REVIEW';
          auditDetails.suggested_retention = aiAnalysis.retention_category;
        }
  
        await supabaseAdmin
          .from('documents')
          .update(updates)
          .eq('id', documentId);
          
        await supabaseAdmin.rpc('create_audit_log', { 
            p_action: auditAction, 
            p_entity_type: 'document', 
            p_entity_id: documentId, 
            p_details: auditDetails 
        });
  
        console.log(`[EnrichmentService] Processed document ${documentId}. Status set to: ${updates.status}`);

        const finalResult: EnrichmentResult = {
            suggestedTitle: aiAnalysis.title,
            predictedRetention: aiAnalysis.retention_category as RetentionCategory,
            detectedPII: piiDetections, 
            extractedText: ocrText,
            confidence: aiAnalysis.confidence, // AI analysis confidence
            ocrConfidence: averageOcrConfidence, // OCR confidence
            metadata: updates.metadata as Record<string, any>,
        };

        return finalResult;
     });
  }

  private async _analyzeTextWithBedrock(text: string): Promise<{ title: string; retention_category: string; document_type: string; confidence: number; }> {
    console.log('Analyzing text with Amazon Bedrock (Claude)...');
    const prompt = `\n\nHuman: Analizează acest text extras dintr-un document oficial românesc și returnează un obiect JSON valid. Text:
---
${text.substring(0, 100000)} 
---
Returnează un obiect JSON cu următoarele câmpuri:
1. "title": Un titlu scurt și sugestiv (max 15 cuvinte).
2. "document_type": Clasifică documentul în una din categoriile: 'contract', 'decision', 'report', 'correspondence', 'legal', 'financial', 'other'.
3. "retention_category": Prezice perioada de retenție. Alege una dintre: '10y', '30y', 'permanent'.
4. "confidence": Un scor de încredere (între 0.0 și 1.0) pentru predicțiile tale.

Asigură-te că output-ul este doar obiectul JSON, fără text adițional.

\n\nAssistant:`;

    const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-v2:1', 
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            prompt: prompt,
            max_tokens_to_sample: 1000,
            temperature: 0.1,
        }),
    });

    try {
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        const jsonMatch = responseBody.completion?.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
            return JSON.parse(jsonMatch[0]);
        }
        console.error("[EnrichmentService] No valid JSON object found in Bedrock completion. Raw:", responseBody.completion);
        return { title: "AI Analysis Failed - Bedrock Parse Error", document_type: "other", retention_category: "10y", confidence: 0.1 };
    } catch (error: unknown) { 
        console.error("[EnrichmentService] Error during Bedrock call or parsing:", error);
        if (typeof error === 'object' && error !== null) {
            if ('name' in error && (error as { name: string }).name === 'AccessDeniedException') {
                console.error("[EnrichmentService] BEDROCK MODEL ACCESS DENIED. Ensure model access is enabled in AWS Bedrock console.");
            } else if ('$metadata' in error && ((error as any).$metadata)?.httpStatusCode === 403) {
                console.error("[EnrichmentService] BEDROCK MODEL ACCESS DENIED (HTTP 403). Ensure model access is enabled in AWS Bedrock console.");
            }
        }
        throw error; 
    }
  }

  private async updateDocumentWithError(documentId: string, errorMessage: string) {
    const currentDoc = await documentService.getDocumentById(documentId);
    const existingMetadata = (currentDoc?.metadata && typeof currentDoc.metadata === 'object' && !Array.isArray(currentDoc.metadata)) 
        ? currentDoc.metadata 
        : {};
    await supabaseAdmin
        .from('documents')
        .update({
             status: 'ERROR',
             metadata: { 
                ...existingMetadata,
                error: errorMessage,
                enrichment_failed_at: new Date().toISOString() 
            }
        })
        .eq('id', documentId);
  }

  // --- MODIFIED: updateOcrResult now accepts calculatedConfidence ---
  private async updateOcrResult(fileId: string, ocrText: string, calculatedConfidence: number) {
      await supabaseAdmin
        .from('document_files')
        .update({
          ocr_text: ocrText,
          ocr_confidence: calculatedConfidence, // Use the dynamic value
          processing_metadata: { processed_at: new Date().toISOString(), engine: 'aws-textract-async' }
        })
        .eq('id', fileId);
  }
}

export const enrichmentService = new EnrichmentService();