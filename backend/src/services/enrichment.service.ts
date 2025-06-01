// backend/src/services/enrichment.service.ts
import { supabaseAdmin, withMonitoring } from '../config/supabase.config';
import { documentService } from './document.service';
import { queueService } from './queue.service';
import { Document, DocumentFile, RetentionCategory, Json } from '../types/database.types';
import { storageService, S3_BUCKETS } from './storage.service';

// AWS SDK Imports for Textract
import {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  JobStatus,
  Block // Import Block type for confidence scores
} from '@aws-sdk/client-textract';

// OpenAI SDK Import
import OpenAI from 'openai';

// Interfaces
export interface EnrichmentResult {
  suggestedTitle?: string;
  predictedRetention?: RetentionCategory;
  description?: string; // Added description
  detectedPII: PIIDetection[];
  extractedText?: string;
  confidence: number;
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

// OpenAI Client Initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const openAIModelId = process.env.OPENAI_MODEL_ID || 'gpt-4-turbo';

const RETENTION_CONFIDENCE_THRESHOLD = 0.90;
export const TEXT_FILE_PROCESSED_DIRECTLY_SIGNAL = "TEXT_FILE_PROCESSED_DIRECTLY_NO_TEXTRACT_JOB";

export class EnrichmentService {
  async startDocumentAnalysis(documentId: string): Promise<string> {
    return withMonitoring('start_document_analysis_dispatch', 'documents', async () => {
      const document = (await documentService.getDocumentById(documentId)) as DocumentWithFiles;
      if (!document) throw new Error(`Document not found for ID: ${documentId}`);

      const originalFile = document.document_files?.find(f => f.file_type === 'original');
      if (!originalFile) throw new Error(`Original file not found for document ID: ${documentId}`);

      if (originalFile.mime_type === 'text/plain') {
        console.log(`[EnrichmentService] Plain text file detected for document ${documentId}. Bypassing Textract.`);
        try {
          const fileData = await storageService.downloadFile(originalFile.storage_bucket, originalFile.storage_key);
          const textContent = fileData.data.toString('utf-8');
          // For plain text, OCR confidence is 1.0 (100%) as the text is perfectly "recognized".
          await this.updateOcrResult(originalFile.id, textContent, 'direct-read', 1.0);

          await queueService.enqueueTask({
            type: 'PROCESS_TEXT_FOR_AI' as any,
            payload: { documentId },
            priority: 7,
          });
          return TEXT_FILE_PROCESSED_DIRECTLY_SIGNAL;
        } catch (error) {
          console.error(`[EnrichmentService] Error processing plain text file ${documentId} directly:`, error);
          await this.updateDocumentWithError(documentId, `Failed to process plain text file directly: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }

      const supportedMimeTypesForTextract = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!originalFile.mime_type || !supportedMimeTypesForTextract.includes(originalFile.mime_type)) {
        const errorMsg = `Unsupported document format for Textract: ${originalFile.mime_type || 'unknown'}.`;
        await this.updateDocumentWithError(documentId, errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`[EnrichmentService] Starting Textract job for document ${documentId}`);
      const command = new StartDocumentAnalysisCommand({
        DocumentLocation: { S3Object: { Bucket: originalFile.storage_bucket, Name: originalFile.storage_key } },
        FeatureTypes: ['FORMS', 'TABLES'],
      });
      const response = await textractClient.send(command);
      if (!response.JobId) {
        throw new Error('Failed to start Textract job, no JobId returned.');
      }
      console.log(`[EnrichmentService] Textract job started: ${response.JobId} for doc ${documentId}`);
      await supabaseAdmin.from('documents').update({
        metadata: { ...(document.metadata as object || {}), textractJobId: response.JobId }
      }).eq('id', documentId);
      return response.JobId;
    });
  }

  async processTextractResult(documentId: string, jobId: string): Promise<{ needsRetry: boolean; ocrText?: string }> {
     return withMonitoring('process_textract_result', 'documents', async () => {
        let nextToken: string | undefined;
        let jobStatus: JobStatus | undefined;
        let allBlocks: Block[] = []; 

        do {
            const command = new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken });
            const response = await textractClient.send(command);
            jobStatus = response.JobStatus;

            if (jobStatus === JobStatus.IN_PROGRESS) {
                console.log(`[EnrichmentService] Textract job ${jobId} still in progress for doc ${documentId}.`);
                return { needsRetry: true };
            }
            if (jobStatus === JobStatus.FAILED || jobStatus === JobStatus.PARTIAL_SUCCESS) {
                const errorMsg = `Textract job ${jobId} for doc ${documentId} failed/partially_succeeded: ${response.StatusMessage}`;
                await this.updateDocumentWithError(documentId, errorMsg);
                throw new Error(errorMsg);
            }
            if (response.Blocks) allBlocks = allBlocks.concat(response.Blocks);
            nextToken = response.NextToken;
        } while (nextToken);

        let totalConfidence = 0;
        let textBlockCount = 0;
        const ocrTextLines: string[] = [];

        allBlocks.forEach(block => {
            if (block.BlockType === 'LINE' && block.Text) {
                ocrTextLines.push(block.Text);
                if (typeof block.Confidence === 'number') {
                    totalConfidence += block.Confidence;
                    textBlockCount++;
                }
            }
        });
        const ocrText = ocrTextLines.join('\n');
        const averageOcrConfidence = textBlockCount > 0 ? (totalConfidence / textBlockCount / 100) : 0;

        const originalFile = (await documentService.getDocumentById(documentId) as DocumentWithFiles)?.document_files?.find(f => f.file_type === 'original');
        if (originalFile) {
            await this.updateOcrResult(originalFile.id, ocrText, 'aws-textract-async', averageOcrConfidence);
        }

        await queueService.enqueueTask({
            type: 'PROCESS_TEXT_FOR_AI' as any,
            payload: { documentId },
            priority: 7,
        });
        return { needsRetry: false, ocrText };
     });
  }

  async performAiAnalysisAndUpdateDb(documentId: string, ocrText: string): Promise<EnrichmentResult> {
    return withMonitoring('perform_ai_analysis_and_update_db', 'documents', async () => {
      console.log(`[EnrichmentService] Performing AI analysis for document ${documentId}`);
      if (!ocrText || ocrText.trim() === "") {
        const errorMsg = "OCR text was empty, cannot perform AI analysis.";
        console.warn(`[EnrichmentService] ${errorMsg} for document ${documentId}.`);
        const currentDocForError = await documentService.getDocumentById(documentId);
        await this.updateDocumentWithError(documentId, errorMsg, currentDocForError?.title || `Review Needed - Empty OCR: ${documentId}`.substring(0,255));
        throw new Error(errorMsg);
      }
      
      const aiAnalysis = await this._analyzeTextWithOpenAI(ocrText);

      const currentDoc = await documentService.getDocumentById(documentId);
      if (!currentDoc) {
        throw new Error(`Document ${documentId} not found during AI analysis final update.`);
      }
      const existingMetadata = (currentDoc.metadata && typeof currentDoc.metadata === 'object' && !Array.isArray(currentDoc.metadata))
          ? currentDoc.metadata
          : {};

      const updates: Partial<Document> = {
        title: (aiAnalysis.title && !aiAnalysis.title.startsWith("AI Analysis Failed") && aiAnalysis.title !== "N/A" && aiAnalysis.title !== "Title Could Not Be Determined by AI") ? aiAnalysis.title : currentDoc.title,
        description: (aiAnalysis.description && aiAnalysis.description !== "N/A") ? aiAnalysis.description : currentDoc.description,
        ai_suggested_title: aiAnalysis.title,
        ai_predicted_retention: aiAnalysis.retention_category as RetentionCategory,
        metadata: {
            ...existingMetadata,
            enrichment_completed_at: new Date().toISOString(),
            enrichment_confidence: aiAnalysis.confidence,
            documentTypeFromAI: aiAnalysis.document_type,
            descriptionFromAI: aiAnalysis.description, 
            ai_provider: 'openai',
            ai_model_id: openAIModelId
        },
        document_type: (aiAnalysis.document_type && aiAnalysis.document_type !== 'other') ? aiAnalysis.document_type : currentDoc.document_type,
      };
      
      let auditAction: string;
      let auditDetails: any = { 
        provider: 'openai', 
        model_id: openAIModelId, 
        confidence: aiAnalysis.confidence, 
        ai_title: aiAnalysis.title,
        ai_document_type: aiAnalysis.document_type, 
        ai_description: aiAnalysis.description 
      };

      // Always update all fields regardless of confidence
      if (aiAnalysis.title && !aiAnalysis.title.startsWith("AI Analysis Failed") && aiAnalysis.title !== "N/A" && aiAnalysis.title !== "Title Could Not Be Determined by AI") {
          updates.title = aiAnalysis.title;
      }
      if (aiAnalysis.document_type && aiAnalysis.document_type !== 'other') {
          updates.document_type = aiAnalysis.document_type;
      }
      // Always set retention_category with AI prediction
      updates.retention_category = aiAnalysis.retention_category as RetentionCategory;

      if (aiAnalysis.confidence >= RETENTION_CONFIDENCE_THRESHOLD) {
        updates.status = 'ACTIVE_STORAGE';
        auditAction = 'AUTONOMOUS_CLASSIFICATION_SUCCESS';
        auditDetails.assigned_retention = updates.retention_category;
        auditDetails.final_title = updates.title;
        auditDetails.final_document_type = updates.document_type;
      } else { 
        updates.status = 'NEEDS_CLASSIFICATION';
        auditAction = 'AUTONOMOUS_CLASSIFICATION_NEEDS_REVIEW';
        auditDetails.suggested_retention = aiAnalysis.retention_category; 
        auditDetails.final_title = updates.title; 
        auditDetails.final_document_type = updates.document_type;
        if (aiAnalysis.title && (aiAnalysis.title.startsWith("AI Analysis Failed") || aiAnalysis.title === "Title Could Not Be Determined by AI")) {
            auditDetails.failure_reason = aiAnalysis.title;
        }
      }
      
      console.log('[EnrichmentService] performAiAnalysisAndUpdateDb - Final updates object WITH status before DB call:', JSON.stringify(updates, null, 2));

      const { data: updatedDbDoc, error: dbUpdateError } = await supabaseAdmin
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (dbUpdateError) {
        console.error(`[EnrichmentService] DATABASE UPDATE FAILED for document ${documentId}:`, JSON.stringify(dbUpdateError, null, 2));
        await this.updateDocumentWithError(documentId, `DB update failed after AI analysis: ${dbUpdateError.message}`, updates.title || currentDoc.title);
        throw new Error(`DB update failed for document ${documentId}: ${dbUpdateError.message}`);
      } else {
        console.log(`[EnrichmentService] Document ${documentId} successfully updated in DB. New status: ${updatedDbDoc?.status}, New title: ${updatedDbDoc?.title}`);
      }

      await supabaseAdmin.rpc('create_audit_log', {
          p_action: auditAction, p_entity_type: 'document', p_entity_id: documentId, p_details: auditDetails
      });
      console.log(`[EnrichmentService] AI Analysis complete for ${documentId}. Final Status: ${updatedDbDoc?.status}, Final Title: ${updatedDbDoc?.title}`);

      return {
          suggestedTitle: aiAnalysis.title,
          predictedRetention: aiAnalysis.retention_category as RetentionCategory,
          description: aiAnalysis.description,
          detectedPII: [],
          extractedText: ocrText,
          confidence: aiAnalysis.confidence,
          metadata: updatedDbDoc?.metadata as Record<string, any> || updates.metadata as Record<string, any>,
      };
    });
  }

  private async _analyzeTextWithOpenAI(text: string): Promise<{ title: string; retention_category: string; document_type: string; description?: string; confidence: number; }> {
    console.log(`Analyzing text with OpenAI API (Model: ${openAIModelId}). Max text length for prompt: 25000 chars.`);
    const systemPrompt = `You are an assistant that analyzes Romanian official documents. Extract specific information and return it ONLY as a valid JSON object. Do not include any explanatory text before or after the JSON. The JSON object should contain fields: "title", "description", "document_type", "retention_category", "confidence". The answer must be in Romanian.
1.  "title": A short, relevant, and suggestive title for the document (max 15 words). If the text is too short or unclear to determine a title, return "N/A".
2.  "description": A brief summary or description of the document's main content or purpose (1-3 sentences, max 70 words). If unclear, return "N/A".
3.  "document_type": Classify the document into ONE of: 'contract', 'decision', 'report', 'correspondence', 'legal', 'financial', 'other'. If unsure, default to 'other'.
4.  "retention_category": Predict the most appropriate retention period. Choose ONE from: '10y', '30y', 'permanent'. If unsure, default to '10y'.
5.  "confidence": A single float number between 0.0 and 1.0 representing your overall confidence in all the predictions made. If the text is very short or uninformative, provide a low confidence score (e.g., 0.1-0.3).`;

    const userPrompt = `Analizează următorul text extras dintr-un document oficial românesc. Respectă cu strictețe formatul JSON specificat în mesajul de sistem.
---
${text.substring(0, 25000)} 
---
Returnează DOAR obiectul JSON.`;

    try {
      const completion = await openai.chat.completions.create({
        model: openAIModelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 700, 
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error("[EnrichmentService] OpenAI API returned no content.");
        return { title: "AI Analysis Failed - OpenAI No Content", description: "N/A", document_type: "other", retention_category: "10y", confidence: 0.1 };
      }
      console.log("[EnrichmentService] Raw OpenAI response content:", content);
      const parsedJson = JSON.parse(content);

      const validatedJson = {
        title: (typeof parsedJson.title === 'string' && parsedJson.title.trim() !== "" && parsedJson.title.trim().toUpperCase() !== "N/A") ? parsedJson.title.trim() : "Title Could Not Be Determined by AI",
        description: (typeof parsedJson.description === 'string' && parsedJson.description.trim().toUpperCase() !== "N/A") ? parsedJson.description.trim() : "",
        document_type: ['contract', 'decision', 'report', 'correspondence', 'legal', 'financial', 'other'].includes(parsedJson.document_type) ? parsedJson.document_type : "other",
        retention_category: ['10y', '30y', 'permanent'].includes(parsedJson.retention_category) ? parsedJson.retention_category : "10y",
        confidence: (typeof parsedJson.confidence === 'number' && parsedJson.confidence >= 0 && parsedJson.confidence <= 1) ? parsedJson.confidence : 0.1,
      };

      if (validatedJson.title === "Title Could Not Be Determined by AI" || validatedJson.confidence < 0.2) {
           console.warn("[EnrichmentService] OpenAI analysis resulted in low confidence or placeholder/default title:", validatedJson);
      }
      return validatedJson;

    } catch (error: unknown) {
      console.error("[EnrichmentService] Error during OpenAI API call or parsing:", error);
      if (error instanceof OpenAI.APIError) {
        console.error("OpenAI API Error Status:", error.status, "Message:", error.message, "Code:", error.code, "Type:", error.type);
      }
      return { title: "AI Analysis Failed - OpenAI Exception", description: "N/A", document_type: "other", retention_category: "10y", confidence: 0.1 };
    }
  }

  private async updateDocumentWithError(documentId: string, errorMessage: string, customTitle?: string) {
    const currentDoc = await documentService.getDocumentById(documentId);
    const existingMetadata = (currentDoc?.metadata && typeof currentDoc.metadata === 'object' && !Array.isArray(currentDoc.metadata))
        ? currentDoc.metadata
        : {};
    
    const titleForError = customTitle || currentDoc?.title || `Error Processing - ${documentId}`.substring(0,255);

    const updatePayload: Partial<Document> = {
        status: 'NEEDS_CLASSIFICATION',
        title: titleForError,
        metadata: { 
            ...existingMetadata, 
            error: errorMessage, 
            enrichment_failed_at: new Date().toISOString(),
            last_known_good_title: (titleForError !== currentDoc?.title) ? currentDoc?.title : undefined
        } as { [key: string]: any }
    };
    if (updatePayload.metadata && (updatePayload.metadata as { [key: string]: any }).last_known_good_title === undefined) {
        delete (updatePayload.metadata as { [key: string]: any }).last_known_good_title;
    }

    console.warn(`[EnrichmentService] Updating document ${documentId} with error state. Title: "${titleForError}", Error: "${errorMessage}". New status: NEEDS_CLASSIFICATION`);
    
    const {error: updateErr} = await supabaseAdmin
        .from('documents')
        .update(updatePayload)
        .eq('id', documentId);
    if(updateErr) {
        console.error(`[EnrichmentService] FAILED to update document ${documentId} with error state in DB:`, updateErr);
    }
  }

  private async updateOcrResult(fileId: string, ocrText: string, engine: string, confidence?: number) {
      await supabaseAdmin
        .from('document_files')
        .update({
          ocr_text: ocrText,
          ocr_confidence: confidence !== undefined ? parseFloat(confidence.toFixed(4)) : null,
          processing_metadata: { processed_at: new Date().toISOString(), engine }
        })
        .eq('id', fileId);
  }
}

export const enrichmentService = new EnrichmentService();