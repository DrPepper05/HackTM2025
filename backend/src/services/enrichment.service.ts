import { supabaseAdmin, withMonitoring } from '../config/supabase.config';
import { documentService } from './document.service';
import { queueService } from './queue.service';
import { Document, DocumentFile, RetentionCategory, Json } from '../types/database.types'; // Added Json import
import { storageService } from './storage.service';

// AWS SDK Imports
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
// Import LanguageCode type from comprehend client
import { ComprehendClient, DetectPiiEntitiesCommand, LanguageCode } from '@aws-sdk/client-comprehend';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Interfaces (remain the same)
export interface EnrichmentResult {
  suggestedTitle?: string;
  predictedRetention?: RetentionCategory;
  detectedPII: PIIDetection[];
  extractedText?: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface PIIDetection {
  type: 'PERSONAL_ID' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'NAME' | 'FINANCIAL' | 'OTHER';
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

type DocumentWithFiles = Document & {
  document_files?: DocumentFile[];
};

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'eu-central-1';
const textractClient = new TextractClient({ region: awsRegion });
const comprehendClient = new ComprehendClient({ region: awsRegion });
const bedrockClient = new BedrockRuntimeClient({ region: awsRegion });

const piiTypeMap: Record<string, PIIDetection['type']> = {
    'NAME': 'NAME',
    'ADDRESS': 'ADDRESS',
    'EMAIL': 'EMAIL',
    'PHONE': 'PHONE',
    'PIN': 'PERSONAL_ID',
    'BANK_ACCOUNT_NUMBER': 'FINANCIAL',
    'CREDIT_DEBIT_NUMBER': 'FINANCIAL',
    'PASSPORT_NUMBER': 'PERSONAL_ID',
    'SSN': 'PERSONAL_ID',
    // AWS Comprehend PII types for Romanian often include AWS_ prefix or specifics
    'RO_PASSPORT_NUMBER': 'PERSONAL_ID',
    'RO_IDENTITY_CARD_NUMBER': 'PERSONAL_ID',
    'RO_CNP': 'PERSONAL_ID', // Cod Numeric Personal
    'RO_PHONE_NUMBER': 'PHONE',
    // Add more mappings as needed based on Comprehend's output for Romanian
};

export class EnrichmentService {
  async enrichDocument(documentId: string): Promise<EnrichmentResult> {
    return withMonitoring('enrich_aws', 'documents', async () => {
      const document = (await documentService.getDocumentById(documentId)) as DocumentWithFiles;
      if (!document) throw new Error('Document not found');

      const originalFile = document.document_files?.find(f => f.file_type === 'original');
      if (!originalFile) throw new Error('Original file not found for document');

      const { data: fileBuffer } = await storageService.downloadFile(
        originalFile.storage_bucket,
        originalFile.storage_key,
      );

      const ocrText = await this._performOCR(fileBuffer);
      if (!ocrText) {
        await this.updateDocumentWithError(documentId, 'Textract returned no text.');
        throw new Error('OCR extraction failed or returned no text.');
      }

      await this.updateOcrResult(originalFile.id, ocrText);

      const [piiDetections, aiAnalysis] = await Promise.all([
        this._detectPII(ocrText),
        this._analyzeTextWithAI(ocrText),
      ]);

      const finalResult: EnrichmentResult = {
        suggestedTitle: aiAnalysis.title,
        predictedRetention: aiAnalysis.retention_category as RetentionCategory,
        detectedPII: piiDetections,
        extractedText: ocrText,
        confidence: aiAnalysis.confidence,
        metadata: {
          fileId: originalFile.id,
          documentTypeFromAI: aiAnalysis.document_type,
          language: 'ro',
        },
      };

      await this.updateDocumentWithEnrichment(documentId, finalResult);

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_ENRICHED',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: { provider: 'aws', ...finalResult },
      });

      return finalResult;
    });
  }

  private async _performOCR(fileBuffer: Buffer): Promise<string> {
    console.log('Performing OCR with AWS Textract...');
    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: fileBuffer },
      FeatureTypes: ['FORMS', 'TABLES'],
    });

    const response = await textractClient.send(command);
    return response.Blocks?.filter(block => block.BlockType === 'LINE')
                           .map(block => block.Text || '')
                           .join('\n') || '';
  }

  private async _detectPII(text: string): Promise<PIIDetection[]> {
    console.log('Detecting PII with AWS Comprehend...');
    const textToAnalyze = text.substring(0, 4999);
    
    const command = new DetectPiiEntitiesCommand({
      Text: textToAnalyze,
      // FIX: Use the imported LanguageCode enum from the SDK
      // For Romanian, the value is 'ro'. The SDK should have a member for it.
      // If LanguageCode.RO doesn't exist, then 'ro' as LanguageCode might be necessary if the enum isn't comprehensive
      // or the string literal type requires it. Let's try explicitly using 'ro' and ensure it's a valid member of the LanguageCode type.
      LanguageCode: 'ro' as LanguageCode,
    });

    const response = await comprehendClient.send(command);

    return (response.Entities || [])
      .filter(entity => 
        entity.Type !== undefined &&
        entity.BeginOffset !== undefined &&
        entity.EndOffset !== undefined
      )
      .map((entity): PIIDetection => ({
        type: piiTypeMap[entity.Type!] || 'OTHER', // entity.Type! is safe due to filter
        value: textToAnalyze.substring(entity.BeginOffset!, entity.EndOffset!), // Safe due to filter
        confidence: entity.Score || 0,
        position: {
          start: entity.BeginOffset!, // Safe due to filter
          end: entity.EndOffset!,   // Safe due to filter
        },
      }));
  }

  private async _analyzeTextWithAI(text: string): Promise<{ title: string; retention_category: string; document_type: string; confidence: number; }> {
    console.log('Analyzing text with Amazon Bedrock (Claude)...');
    const prompt = `\n\nHuman: Analizează acest text extras dintr-un document oficial românesc și returnează un obiect JSON valid. Text:
---
${text.substring(0, 20000)} 
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

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    try {
        // Attempt to find JSON within the completion, as Claude sometimes adds leading/trailing text
        const jsonMatch = responseBody.completion.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("No valid JSON object found in Bedrock completion.");
    } catch (e) {
        console.error("Failed to parse Bedrock response as JSON. Raw completion:", responseBody.completion, "Error:", e);
        // Fallback if parsing fails, to prevent crashing the entire process
        return {
            title: "AI Analysis Failed",
            document_type: "other",
            retention_category: "10y",
            confidence: 0.1
        };
    }
  }

  private async updateDocumentWithError(documentId: string, errorMessage: string) {
    const currentDoc = await documentService.getDocumentById(documentId);
    
    // FIX: Ensure metadata is treated as an object before spreading
    const existingMetadata = (currentDoc?.metadata && typeof currentDoc.metadata === 'object' && !Array.isArray(currentDoc.metadata)) 
        ? currentDoc.metadata 
        : {};

    await supabaseAdmin
        .from('documents')
        .update({
             metadata: { 
                ...existingMetadata,
                error: errorMessage,
                enrichment_failed_at: new Date().toISOString() 
            }
            // Optionally keep status as 'INGESTING' or a specific error status if you add one
        })
        .eq('id', documentId);
  }

  private async updateOcrResult(fileId: string, ocrText: string) {
      await supabaseAdmin
        .from('document_files')
        .update({
          ocr_text: ocrText,
          ocr_confidence: 0.95, 
          processing_metadata: { processed_at: new Date().toISOString(), engine: 'aws-textract' }
        })
        .eq('id', fileId);
  }
  
  private async updateDocumentWithEnrichment(documentId: string, enrichment: EnrichmentResult) {
    const currentDoc = await documentService.getDocumentById(documentId);
    if (!currentDoc) {
        console.error(`Could not find document ${documentId} to update with enrichment results.`);
        return;
    }

    // FIX: Ensure metadata is treated as an object before spreading
    const existingMetadata = (currentDoc.metadata && typeof currentDoc.metadata === 'object' && !Array.isArray(currentDoc.metadata))
        ? currentDoc.metadata
        : {};

    await supabaseAdmin
        .from('documents')
        .update({
            status: 'ACTIVE_STORAGE',
            ai_suggested_title: enrichment.suggestedTitle,
            ai_predicted_retention: enrichment.predictedRetention,
            ai_detected_pii: enrichment.detectedPII,
            metadata: {
                ...existingMetadata,
                enrichment_completed_at: new Date().toISOString(),
                enrichment_confidence: enrichment.confidence,
                documentTypeFromAI: enrichment.metadata.documentTypeFromAI,
            },
            document_type: currentDoc.document_type || enrichment.metadata.documentTypeFromAI,
        })
        .eq('id', documentId);
  }
  
  async queueDocumentEnrichment(documentId: string, priority: number = 5): Promise<string> {
      return queueService.enqueueTask({
          type: 'DOCUMENT_ENRICHMENT',
          payload: { documentId },
          priority,
      });
  }
}

export const enrichmentService = new EnrichmentService();