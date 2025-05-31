import { supabaseAdmin, withMonitoring } from '../config/supabase.config';
import { documentService } from './document.service';
import { queueService } from './queue.service';
import { Document, DocumentFile, RetentionCategory, Json } from '../types/database.types';
import { storageService } from './storage.service';

// AWS SDK Imports
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Google Cloud DLP Import
import { DlpServiceClient, protos } from '@google-cloud/dlp';

// PDF Processing
import { PDFDocument } from 'pdf-lib';

type IInspectContentResponse = protos.google.privacy.dlp.v2.IInspectContentResponse;
type IFinding = protos.google.privacy.dlp.v2.IFinding;
type IInfoType = protos.google.privacy.dlp.v2.IInfoType;
type ILocation = protos.google.privacy.dlp.v2.ILocation;
// Define a simple interface for byte range
interface IBytesRange {
  start: number;
  end: number;
}
type IInspectContentRequest = protos.google.privacy.dlp.v2.IInspectContentRequest;
// Corrected: Use ByteContentItem instead of IByteContentItem
type DLPBytesType = protos.google.privacy.dlp.v2.ByteContentItem.BytesType;
// Interfaces
export interface EnrichmentResult {
  suggestedTitle?: string;
  predictedRetention?: RetentionCategory;
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
const bedrockClient = new BedrockRuntimeClient({ region: awsRegion });

// Google DLP Client
const dlpClient = new DlpServiceClient();
const gcpProjectId = process.env.GCP_PROJECT_ID;

const googleDlpPiiTypeMap: Record<string, PIIDetection['type']> = {
    'PERSON_NAME': 'NAME',
    'ROMANIA_CNP_CODE': 'PERSONAL_ID',
    'EMAIL_ADDRESS': 'EMAIL',
    'PHONE_NUMBER': 'PHONE',
    'STREET_ADDRESS': 'ADDRESS',
    'CREDIT_CARD_NUMBER': 'FINANCIAL',
    'IBAN_CODE': 'FINANCIAL',
    'SWIFT_CODE': 'FINANCIAL',
    'ORGANIZATION_NAME': 'ORGANIZATION',
    'DATE': 'DATE',
    'LOCATION': 'LOCATION',
};

// Define a more specific type for findings that pass our filter
interface ValidatedFinding extends IFinding {
  infoType: IInfoType & { name: string };
  // Updated to use the corrected IBytesRange which internally uses ByteContentItem
  location: ILocation & { byteRange: IBytesRange & { start: string | number | Long; end: string | number | Long }};
  quote: string; 
}

export class EnrichmentService {
  async enrichDocument(documentId: string): Promise<EnrichmentResult> {
    return withMonitoring('enrich_aws_gcp', 'documents', async () => {
      const document = (await documentService.getDocumentById(documentId)) as DocumentWithFiles;
      if (!document) throw new Error(`Document not found for ID: ${documentId}`);

      const originalFile = document.document_files?.find(f => f.file_type === 'original');
      if (!originalFile) throw new Error(`Original file not found for document ID: ${documentId}`);

      // Check if the file format is supported by Textract
      const supportedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
      ];

      console.log(`[EnrichmentService] Processing file with MIME type: ${originalFile.mime_type || 'unknown'}`);

      if (!originalFile.mime_type || !supportedMimeTypes.includes(originalFile.mime_type)) {
        const errorMsg = `Unsupported document format: ${originalFile.mime_type || 'unknown'}. Supported formats are: ${supportedMimeTypes.join(', ')}`;
        await this.updateDocumentWithError(documentId, errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`[EnrichmentService] Downloading file from bucket: ${originalFile.storage_bucket}, key: ${originalFile.storage_key}`);
      const { data: fileBuffer } = await storageService.downloadFile(
        originalFile.storage_bucket,
        originalFile.storage_key,
      );

      if (!fileBuffer) {
        const errorMsg = 'Failed to download file or empty file received';
        await this.updateDocumentWithError(documentId, errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`[EnrichmentService] Successfully downloaded file, size: ${fileBuffer.length} bytes`);

      const ocrText = await this._performOCRWithTextract(fileBuffer);
      if (!ocrText) {
        await this.updateDocumentWithError(documentId, 'Textract returned no text or failed.');
        throw new Error('OCR extraction failed or returned no text.');
      }
      await this.updateOcrResult(originalFile.id, ocrText);

      let piiDetections: PIIDetection[] = [];
      let aiAnalysis: { title: string; retention_category: string; document_type: string; confidence: number; };
      
      const documentLanguage = 'ro'; 
      console.log(`[EnrichmentService] Document language assumed/detected as: ${documentLanguage}`);

      if (documentLanguage === 'ro') {
        try {
          console.log(`[EnrichmentService] Attempting PII detection with Google DLP for Romanian text.`);
          piiDetections = await this._detectPiiWithGoogleDLP(ocrText, documentLanguage);
        } catch (gDlpError) {
          console.warn(`[EnrichmentService] Google DLP PII detection failed for document ${documentId}:`, gDlpError);
        }
      } else {
        console.warn(`[EnrichmentService] PII detection for language '${documentLanguage}' not configured with Google DLP. Skipping or implement alternative.`);
      }

      try {
        aiAnalysis = await this._analyzeTextWithBedrock(ocrText);
      } catch (aiError: unknown) {
        console.error(`[EnrichmentService] Bedrock AI analysis failed for document ${documentId}:`, aiError);
        let isAccessDenied = false;
        if (typeof aiError === 'object' && aiError !== null) {
            if ('name' in aiError && (aiError as { name: string }).name === 'AccessDeniedException') {
                isAccessDenied = true;
            } else if ('$metadata' in aiError && ((aiError as any).$metadata)?.httpStatusCode === 403) {
                isAccessDenied = true;
            }
        }
        if (isAccessDenied) {
             console.error("[EnrichmentService] BEDROCK MODEL ACCESS DENIED. Ensure model access is enabled in AWS Bedrock console.");
        }
        await this.updateDocumentWithError(documentId, `AI analysis failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
        throw aiError; 
      }
      
      const finalResult: EnrichmentResult = {
        suggestedTitle: aiAnalysis.title,
        predictedRetention: aiAnalysis.retention_category as RetentionCategory,
        detectedPII: piiDetections,
        extractedText: ocrText,
        confidence: aiAnalysis.confidence,
        metadata: { 
            fileId: originalFile.id,
            documentTypeFromAI: aiAnalysis.document_type,
            language: documentLanguage,
         },
      };

      await this.updateDocumentWithEnrichment(documentId, finalResult);
      await supabaseAdmin.rpc('create_audit_log', { 
          p_action: 'DOCUMENT_ENRICHED', 
          p_entity_type: 'document', 
          p_entity_id:documentId, 
          p_details: { provider: 'aws_gcp', ...finalResult } 
      });
      return finalResult;
    });
  }

  private async _performOCRWithTextract(fileBuffer: Buffer): Promise<string> {
    console.log('Performing OCR with AWS Textract...');
    try {
      // Validate file buffer
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Empty file buffer provided to Textract');
      }

      // Log file details for debugging
      console.log(`[EnrichmentService] File buffer size: ${fileBuffer.length} bytes`);
      console.log(`[EnrichmentService] First few bytes: ${fileBuffer.slice(0, 20).toString('hex')}`);

      // Check for PDF magic number
      const isPDF = fileBuffer.slice(0, 4).toString('hex') === '25504446';
      // Check for JPEG magic number
      const isJPEG = fileBuffer.slice(0, 2).toString('hex') === 'ffd8';
      // Check for PNG magic number
      const isPNG = fileBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';

      console.log(`[EnrichmentService] File format detection: PDF=${isPDF}, JPEG=${isJPEG}, PNG=${isPNG}`);

      let processedBuffer = fileBuffer;

      // If it's a PDF, try to convert it to a more compatible format
      if (isPDF) {
        try {
          console.log('[EnrichmentService] Converting PDF to ensure Textract compatibility...');
          const pdfDoc = await PDFDocument.load(fileBuffer);
          
          // Convert to PDF 1.4 (more widely supported)
          const convertedPdf = await pdfDoc.save({
            useObjectStreams: false,
            addDefaultPage: false
          });
          
          processedBuffer = Buffer.from(convertedPdf);
          console.log(`[EnrichmentService] Converted PDF size: ${processedBuffer.length} bytes`);
        } catch (pdfError) {
          console.warn('[EnrichmentService] PDF conversion failed, using original file:', pdfError);
        }
      } else if (!isPDF && !isJPEG && !isPNG) {
        throw new Error('File content does not match expected format signatures');
      }

      const command = new AnalyzeDocumentCommand({
        Document: { Bytes: processedBuffer },
        FeatureTypes: ['FORMS', 'TABLES'],
      });

      console.log('[EnrichmentService] Sending request to Textract...');
      const response = await textractClient.send(command);
      console.log('[EnrichmentService] Received response from Textract');

      return response.Blocks?.filter(block => block.BlockType === 'LINE')
                             .map(block => block.Text || '')
                             .join('\n') || '';
    } catch (error: any) {
      console.error('[EnrichmentService] Textract error:', error);
      
      // Handle specific Textract errors
      if (error.name === 'UnsupportedDocumentException') {
        throw new Error(`Document format not supported by Textract: ${error.message}`);
      } else if (error.name === 'InvalidDocumentException') {
        throw new Error(`Invalid document: ${error.message}`);
      } else if (error.name === 'DocumentTooLargeException') {
        throw new Error(`Document is too large for Textract processing: ${error.message}`);
      } else if (error.name === 'BadDocumentException') {
        throw new Error(`Document is corrupted or invalid: ${error.message}`);
      } else if (error.name === 'AccessDeniedException') {
        throw new Error(`Access denied to Textract service: ${error.message}`);
      } else {
        throw new Error(`Textract processing failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  private async _detectPiiWithGoogleDLP(text: string, languageCode: string): Promise<PIIDetection[]> {
    if (!gcpProjectId) {
        console.error('[EnrichmentService] GCP_PROJECT_ID is not set in .env. Cannot use Google DLP.');
        return [];
    }
    console.log(`Detecting PII with Google DLP for language: ${languageCode}...`);
    const parent = `projects/${gcpProjectId}/locations/global`;

    const infoTypesToDetect = [
      { name: 'PERSON_NAME' }, { name: 'PHONE_NUMBER' }, { name: 'EMAIL_ADDRESS' },
      { name: 'STREET_ADDRESS' }, { name: 'ROMANIA_CNP_CODE' }, 
      { name: 'IBAN_CODE' }, { name: 'SWIFT_CODE' }, { name: 'CREDIT_CARD_NUMBER' },
      { name: 'DATE' }, { name: 'LOCATION' }, { name: 'ORGANIZATION_NAME' },
    ];

    const item = {
        byteItem: {
            type: 'TEXT_UTF8' as unknown as DLPBytesType, // DLPBytesType now uses ByteContentItem
            data: Buffer.from(text.substring(0, 500000)) 
        }
    };
    
    const request: IInspectContentRequest = { 
      parent: parent,
      inspectConfig: {
        infoTypes: infoTypesToDetect,
        includeQuote: true,
        minLikelihood: protos.google.privacy.dlp.v2.Likelihood.POSSIBLE,
      },
      item: item,
    };

    try {
      const operationResult = await dlpClient.inspectContent(request);
      const response: IInspectContentResponse = operationResult[0]; 
      const findings = response.result?.findings || [];

      return findings
        .filter((finding: IFinding): finding is ValidatedFinding =>
            finding.infoType?.name != null && 
            finding.location?.byteRange?.start != null &&
            finding.location?.byteRange?.end != null &&
            finding.quote != null 
        )
        .map((finding: ValidatedFinding): PIIDetection => { 
            const findingLikelihood = finding.likelihood || protos.google.privacy.dlp.v2.Likelihood.LIKELIHOOD_UNSPECIFIED;
            let confidenceScore = 0.1;
            switch(findingLikelihood) {
                case protos.google.privacy.dlp.v2.Likelihood.VERY_LIKELY: confidenceScore = 0.9; break;
                case protos.google.privacy.dlp.v2.Likelihood.LIKELY: confidenceScore = 0.7; break;
                case protos.google.privacy.dlp.v2.Likelihood.POSSIBLE: confidenceScore = 0.5; break;
                case protos.google.privacy.dlp.v2.Likelihood.UNLIKELY: confidenceScore = 0.3; break;
                case protos.google.privacy.dlp.v2.Likelihood.VERY_UNLIKELY: confidenceScore = 0.1; break;
            }

            return {
              type: googleDlpPiiTypeMap[finding.infoType.name] || 'OTHER',
              value: finding.quote,
              confidence: confidenceScore,
              position: {
                start: parseInt(String(finding.location.byteRange.start), 10),
                end: parseInt(String(finding.location.byteRange.end), 10),
              },
            };
        });
    } catch (error) {
        console.error('[EnrichmentService] Error during Google DLP PII detection:', error);
        throw error; 
    }
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
             metadata: { 
                ...existingMetadata,
                error: errorMessage,
                enrichment_failed_at: new Date().toISOString() 
            }
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