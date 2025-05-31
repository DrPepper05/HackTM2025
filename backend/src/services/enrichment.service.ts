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
  JobStatus
} from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Google Cloud DLP Import - Commented out for disabling PII detection
// import { DlpServiceClient, protos } from '@google-cloud/dlp';
import { PDFDocument } from 'pdf-lib';

// type IInspectContentResponse = protos.google.privacy.dlp.v2.IInspectContentResponse;
// type IFinding = protos.google.privacy.dlp.v2.IFinding;
// type IInfoType = protos.google.privacy.dlp.v2.IInfoType;
// type ILocation = protos.google.privacy.dlp.v2.ILocation;
// interface IBytesRange { start: number; end: number; }
// type IInspectContentRequest = protos.google.privacy.dlp.v2.IInspectContentRequest;
// type DLPBytesType = protos.google.privacy.dlp.v2.ByteContentItem.BytesType;

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

// Google DLP Client - Commented out for disabling PII detection
// const dlpClient = new DlpServiceClient();
// const gcpProjectId = process.env.GCP_PROJECT_ID;

// const googleDlpPiiTypeMap: Record<string, PIIDetection['type']> = {
//     'PERSON_NAME': 'NAME',
//     'ROMANIA_CNP_CODE': 'PERSONAL_ID',
//     'EMAIL_ADDRESS': 'EMAIL',
//     'PHONE_NUMBER': 'PHONE',
//     'STREET_ADDRESS': 'ADDRESS',
//     'CREDIT_CARD_NUMBER': 'FINANCIAL',
//     'IBAN_CODE': 'FINANCIAL',
//     'SWIFT_CODE': 'FINANCIAL',
//     'ORGANIZATION_NAME': 'ORGANIZATION',
//     'DATE': 'DATE',
//     'LOCATION': 'LOCATION',
// };

// interface ValidatedFinding extends IFinding {
//   infoType: IInfoType & { name: string };
//   location: ILocation & { byteRange: IBytesRange & { start: string | number | Long; end: string | number | Long }};
//   quote: string; 
// }

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
        FeatureTypes: ['FORMS', 'TABLES'],
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
        let allBlocks: any[] = [];

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

        const ocrText = allBlocks.filter(block => block.BlockType === 'LINE').map(block => block.Text || '').join('\n');
        
        const originalFile = (await documentService.getDocumentById(documentId) as DocumentWithFiles)?.document_files?.find(f => f.file_type === 'original');
        if (originalFile) {
            await this.updateOcrResult(originalFile.id, ocrText);
        }

        // PII detection is now disabled.
        const piiDetections: PIIDetection[] = [];
        // try {
        //     console.log(`[EnrichmentService] Attempting PII detection with Google DLP.`);
        //     piiDetections = await this._detectPiiWithGoogleDLP(ocrText, 'ro');
        // } catch (gDlpError) {
        //     console.warn(`[EnrichmentService] Google DLP PII detection failed for document ${documentId}:`, gDlpError);
        // }

        const aiAnalysis = await this._analyzeTextWithBedrock(ocrText);
        
        const finalResult: EnrichmentResult = {
            suggestedTitle: aiAnalysis.title,
            predictedRetention: aiAnalysis.retention_category as RetentionCategory,
            detectedPII: piiDetections, // Will be an empty array
            extractedText: ocrText,
            confidence: aiAnalysis.confidence,
            metadata: { 
                fileId: originalFile?.id,
                documentTypeFromAI: aiAnalysis.document_type,
                language: 'ro',
            },
        };

        await this.updateDocumentWithEnrichment(documentId, finalResult);
        await supabaseAdmin.rpc('create_audit_log', { 
            p_action: 'DOCUMENT_ENRICHED', 
            p_entity_type: 'document', 
            p_entity_id: documentId, 
            p_details: { provider: 'aws_gcp_async', ...finalResult } 
        });

        console.log(`[EnrichmentService] Successfully enriched document ${documentId} from job ${jobId}.`);
        return finalResult;
     });
  }

  /**
   * PII detection function - Commented out
   */
  // private async _detectPiiWithGoogleDLP(text: string, languageCode: string): Promise<PIIDetection[]> {
  //   if (!gcpProjectId) {
  //       console.error('[EnrichmentService] GCP_PROJECT_ID is not set in .env. Cannot use Google DLP.');
  //       return [];
  //   }
  //   console.log(`Detecting PII with Google DLP for language: ${languageCode}...`);
  //   const parent = `projects/${gcpProjectId}/locations/global`;

  //   const infoTypesToDetect = [
  //     { name: 'PERSON_NAME' }, { name: 'PHONE_NUMBER' }, { name: 'EMAIL_ADDRESS' },
  //     { name: 'STREET_ADDRESS' }, { name: 'ROMANIA_CNP_CODE' }, 
  //     { name: 'IBAN_CODE' }, { name: 'SWIFT_CODE' }, { name: 'CREDIT_CARD_NUMBER' },
  //     { name: 'DATE' }, { name: 'LOCATION' }, { name: 'ORGANIZATION_NAME' },
  //   ];

  //   const item = {
  //       byteItem: {
  //           type: 'TEXT_UTF8' as unknown as DLPBytesType, 
  //           data: Buffer.from(text.substring(0, 500000)) 
  //       }
  //   };
    
  //   const request: IInspectContentRequest = { 
  //     parent: parent,
  //     inspectConfig: {
  //       infoTypes: infoTypesToDetect,
  //       includeQuote: true,
  //       minLikelihood: protos.google.privacy.dlp.v2.Likelihood.POSSIBLE,
  //     },
  //     item: item,
  //   };

  //   try {
  //     const operationResult = await dlpClient.inspectContent(request);
  //     const response: IInspectContentResponse = operationResult[0]; 
  //     const findings = response.result?.findings || [];

  //     return findings
  //       .filter((finding: IFinding): finding is ValidatedFinding =>
  //           finding.infoType?.name != null && 
  //           finding.location?.byteRange?.start != null &&
  //           finding.location?.byteRange?.end != null &&
  //           finding.quote != null 
  //       )
  //       .map((finding: ValidatedFinding): PIIDetection => { 
  //           const findingLikelihood = finding.likelihood || protos.google.privacy.dlp.v2.Likelihood.LIKELIHOOD_UNSPECIFIED;
  //           let confidenceScore = 0.1;
  //           switch(findingLikelihood) {
  //               case protos.google.privacy.dlp.v2.Likelihood.VERY_LIKELY: confidenceScore = 0.9; break;
  //               case protos.google.privacy.dlp.v2.Likelihood.LIKELY: confidenceScore = 0.7; break;
  //               case protos.google.privacy.dlp.v2.Likelihood.POSSIBLE: confidenceScore = 0.5; break;
  //               case protos.google.privacy.dlp.v2.Likelihood.UNLIKELY: confidenceScore = 0.3; break;
  //               case protos.google.privacy.dlp.v2.Likelihood.VERY_UNLIKELY: confidenceScore = 0.1; break;
  //           }

  //           return {
  //             type: googleDlpPiiTypeMap[finding.infoType.name] || 'OTHER',
  //             value: finding.quote,
  //             confidence: confidenceScore,
  //             position: {
  //               start: parseInt(String(finding.location.byteRange.start), 10),
  //               end: parseInt(String(finding.location.byteRange.end), 10),
  //             },
  //           };
  //       });
  //   } catch (error) {
  //       console.error('[EnrichmentService] Error during Google DLP PII detection:', error);
  //       throw error; 
  //   }
  // }

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

  private async updateOcrResult(fileId: string, ocrText: string) {
      await supabaseAdmin
        .from('document_files')
        .update({
          ocr_text: ocrText,
          ocr_confidence: 0.95, 
          processing_metadata: { processed_at: new Date().toISOString(), engine: 'aws-textract-async' }
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
            // ai_detected_pii: enrichment.detectedPII, // Commented out
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
}

export const enrichmentService = new EnrichmentService();