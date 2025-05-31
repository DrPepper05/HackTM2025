import { supabaseAdmin, withMonitoring } from '../config/supabase.config'
import { storageService, S3_BUCKETS, generateS3Key } from './storage.service'
import { 
  Document, 
  DocumentFile, 
  DocumentStatus, 
  RetentionCategory,
  isDocumentStatus,
  isRetentionCategory 
} from '../types/database.types'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { calculateChecksum } from '../utils/checksum.util'
import { 
  TextractClient,
  DetectDocumentTextCommand
} from '@aws-sdk/client-textract'

// Create Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

// Extended Document type that includes related files
interface DocumentWithFiles extends Document {
  document_files?: DocumentFile[]
}

export interface CreateDocumentDto {
  title: string
  description?: string
  document_type?: string
  document_number?: string
  creator_info?: Record<string, any>
  creation_date?: string
  retention_category?: RetentionCategory
  metadata?: Record<string, any>
  tags?: string[]
}

export interface UpdateDocumentDto {
  title?: string
  description?: string
  document_type?: string
  document_number?: string
  retention_category?: RetentionCategory
  is_public?: boolean
  release_date?: string
  confidentiality_note?: string
  metadata?: Record<string, any>
  tags?: string[]
}

export interface DocumentFilter {
  status?: DocumentStatus
  is_public?: boolean
  retention_category?: RetentionCategory
  uploader_user_id?: string
  search?: string
  tags?: string[]
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

export interface FileUploadResult {
  fileId: string
  storageKey: string
  checksum: string
  fileSize: number
}

export class DocumentService {
  /**
   * Create a new document with initial file
   */
  async createDocument(
    file: { 
      buffer: Buffer
      originalname: string
      mimetype: string
      size: number
    },
    metadata: CreateDocumentDto,
    userId: string
  ): Promise<Document> {
    return withMonitoring('create', 'documents', async () => {
      // 1. Calculate file checksum
      const checksum = createHash('sha256').update(file.buffer).digest('hex')
      
      // 2. Get user profile information for creator_info
      let creatorInfo = metadata.creator_info || {}
      
      // If no creator_info provided, get the current user's information
      if (Object.keys(creatorInfo).length === 0) {
        const { data: userProfile, error: userError } = await supabaseAdmin
          .from('user_profiles')
          .select('full_name, email, institution')
          .eq('id', userId)
          .single()
        
        if (!userError && userProfile) {
          creatorInfo = {
            created_by_user_id: userId,
            creator_name: userProfile.full_name,
            creator_email: userProfile.email,
            creator_institution: userProfile.institution
          }
        } else {
          // Fallback if profile not found
          creatorInfo = {
            created_by_user_id: userId
          }
        }
      }
      
      // 3. Start transaction-like operation
      let documentId: string | null = null
      let fileId: string | null = null
      let s3Key: string | null = null

      try {
        // 4. Create document record
        const { data: document, error: docError } = await supabaseAdmin
          .from('documents')
          .insert({
            title: metadata.title,
            description: metadata.description,
            document_type: metadata.document_type,
            document_number: metadata.document_number,
            creator_info: creatorInfo,
            creation_date: metadata.creation_date,
            status: 'INGESTING',
            retention_category: metadata.retention_category,
            uploader_user_id: userId,
            metadata: metadata.metadata || {},
            tags: metadata.tags || []
          })
          .select()
          .single()

        if (docError) throw docError
        documentId = document.id

        // 5. Generate S3 key
        s3Key = generateS3Key(file.originalname, documentId!, 'original')

        // 6. Upload to S3
        await storageService.uploadFile(
          S3_BUCKETS.DOCUMENTS,
          s3Key,
          file.buffer,
          {
            'content-type': file.mimetype,
            'document-id': documentId!,
            'uploaded-by': userId
          }
        )

        // 7. Create file record
        const { data: fileRecord, error: fileError } = await supabaseAdmin
          .from('document_files')
          .insert({
            document_id: documentId,
            file_type: 'original',
            file_name: file.originalname,
            storage_bucket: S3_BUCKETS.DOCUMENTS,
            storage_key: s3Key,
            mime_type: file.mimetype,
            checksum,
            file_size: file.size
          })
          .select()
          .single()

        if (fileError) throw fileError
        fileId = fileRecord.id

        // 8. Queue for enrichment
        await this.queueEnrichment(documentId!) // Ensure this is called

        // 9. Create audit log
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'DOCUMENT_UPLOADED',
          p_entity_type: 'document',
          p_entity_id: documentId!,
          p_details: {
            file_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype,
            checksum
          }
        })

        return document
      } catch (error) {
        console.error("[DocumentService] Error in createDocument, attempting rollback:", error);
        // Rollback operations
        if (fileId) {
          console.log(`[DocumentService] Rolling back file record: ${fileId}`);
          await supabaseAdmin
            .from('document_files')
            .delete()
            .eq('id', fileId)
        }
        
        if (documentId) {
          console.log(`[DocumentService] Rolling back document record: ${documentId}`);
          await supabaseAdmin
            .from('documents')
            .delete()
            .eq('id', documentId)
        }

        if (s3Key) {
          console.log(`[DocumentService] Rolling back S3 file: ${s3Key}`);
          await storageService.deleteFile(S3_BUCKETS.DOCUMENTS, s3Key)
        }

        throw error
      }
    })
  }

  /**
   * Get documents with filters
   */
  async getDocuments(filters: DocumentFilter = {}): Promise<{
    documents: Document[]
    total: number
  }> {
    return withMonitoring('list', 'documents', async () => {
        console.log('DocumentService.getDocuments - Input filters:', filters);
        
        let query = supabaseAdmin
            .from('documents')
            .select('*, document_files(*)', { count: 'exact' })

        if (filters.status) {
            console.log('DocumentService.getDocuments - Applying status filter:', filters.status);
            query = query.eq('status', filters.status)
        }
        if (filters.is_public !== undefined) {
            console.log('DocumentService.getDocuments - Applying is_public filter:', filters.is_public);
            query = query.eq('is_public', filters.is_public)
        }
        if (filters.retention_category) {
            console.log('DocumentService.getDocuments - Applying retention_category filter:', filters.retention_category);
            query = query.eq('retention_category', filters.retention_category)
        }
        if (filters.uploader_user_id) {
            console.log('DocumentService.getDocuments - Applying uploader_user_id filter:', filters.uploader_user_id);
            query = query.eq('uploader_user_id', filters.uploader_user_id)
        }
        if (filters.tags && filters.tags.length > 0) {
            console.log('DocumentService.getDocuments - Applying tags filter:', filters.tags);
            query = query.contains('tags', filters.tags)
        }
        if (filters.from_date) {
            console.log('DocumentService.getDocuments - Applying from_date filter:', filters.from_date);
            query = query.gte('created_at', filters.from_date)
        }
        if (filters.to_date) {
            console.log('DocumentService.getDocuments - Applying to_date filter:', filters.to_date);
            query = query.lte('created_at', filters.to_date)
        }
        if (filters.search) {
            console.log('DocumentService.getDocuments - Applying search filter:', filters.search);
            query = query.textSearch('search_vector', filters.search, {
                type: 'websearch',
                config: 'romanian'
            })
        }

        const limit = filters.limit || 20
        const offset = filters.offset || 0
        query = query.range(offset, offset + limit - 1)
        query = query.order('created_at', { ascending: false })

        console.log('DocumentService.getDocuments - Final query about to execute');
        const { data, error, count } = await query

        if (error) {
            console.error('DocumentService.getDocuments - Database error:', error);
            throw error;
        }

        console.log('DocumentService.getDocuments - Query results:', {
            documentsFound: data?.length || 0,
            totalCount: count || 0,
            sampleUploaderIds: data?.slice(0, 3).map(d => d.uploader_user_id) || []
        });

        return {
            documents: data || [],
            total: count || 0
        }
    })
  }

    /**
     * Get single document by ID
     */
    async getDocumentById(documentId: string): Promise<DocumentWithFiles | null> {
    return withMonitoring('get', 'documents', async () => {
        const { data, error } = await supabaseAdmin
        .from('documents')
        .select('*, document_files(*)')
        .eq('id', documentId)
        .single()

        if (error) {
          if (error.code === 'PGRST116') return null 
          throw error
        }
        return data as DocumentWithFiles
    })
    }

    /**
     * Update document metadata
     */
    async updateDocument(
    documentId: string,
    updates: UpdateDocumentDto,
    userId: string
    ): Promise<Document> {
    return withMonitoring('update', 'documents', async () => {
        const { data: currentDoc } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

        if (!currentDoc) {
        throw new Error('Document not found')
        }

        const { data, error } = await supabaseAdmin
        .from('documents')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

        if (error) throw error

        await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_UPDATED',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: {
            updates,
            previous_values: currentDoc,
            updated_by: userId
        }
        })
        return data
    })
    }

    /**
     * Transition document to a new status
     */
    async transitionDocumentStatus(
    documentId: string,
    newStatus: DocumentStatus,
    notes?: string
    ): Promise<Document> {
    if (!isDocumentStatus(newStatus)) {
        throw new Error(`Invalid document status: ${newStatus}`)
    }

    return withMonitoring('transition', 'documents', async () => {
        const { data, error } = await supabaseAdmin.rpc('transition_document_status', {
        p_document_id: documentId,
        p_new_status: newStatus,
        p_notes: notes
        })

        if (error) throw error
        return data
    })
    }

    /**
     * Add a file to an existing document
     */
    async addDocumentFile(
    documentId: string,
    file: {
        buffer: Buffer
        originalname: string
        mimetype: string
        size: number
    },
    fileType: 'original' | 'redacted' | 'ocr_text' | 'transfer',
    userId: string
    ): Promise<DocumentFile> {
    return withMonitoring('create', 'document_files', async () => {
        const document = await this.getDocumentById(documentId)
        if (!document) {
          throw new Error('Document not found')
        }

        const checksum = createHash('sha256').update(file.buffer).digest('hex')
        // Consider making S3 key generation more specific based on fileType
        const s3Key = generateS3Key(file.originalname, documentId, fileType === 'transfer' ? 'transfer' : 'original') 

        await storageService.uploadFile(
          S3_BUCKETS.DOCUMENTS, // Or a different bucket based on fileType
          s3Key,
          file.buffer,
          {
            'content-type': file.mimetype,
            'document-id': documentId,
            'file-type': fileType
          }
        )

        const { data, error } = await supabaseAdmin
          .from('document_files')
          .insert({
            document_id: documentId,
            file_type: fileType,
            file_name: file.originalname,
            storage_bucket: S3_BUCKETS.DOCUMENTS, // Or a different bucket
            storage_key: s3Key,
            mime_type: file.mimetype,
            checksum,
            file_size: file.size
          })
          .select()
          .single()

        if (error) throw error

        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'FILE_ADDED',
          p_entity_type: 'document_file',
          p_entity_id: data.id,
          p_details: { 
            document_id: documentId,
            file_type: fileType,
            file_name: file.originalname,
            added_by: userId
           }
        })
        return data
    })
    }

    /**
     * Get file download URL
     */
    async getFileDownloadUrl(
    fileId: string,
    expiresIn: number = 3600
    ): Promise<string> {
      const { data: file, error } = await supabaseAdmin
          .from('document_files')
          .select('*')
          .eq('id', fileId)
          .single()

      if (error || !file) {
          throw new Error('File not found')
      }

      const url = await storageService.generatePresignedUrl(
          file.storage_bucket,
          file.storage_key,
          expiresIn
      )

      if (!url) {
          throw new Error('Failed to generate download URL')
      }
      return url
    }

    /**
     * Queue document for enrichment processing
     */
    private async queueEnrichment(documentId: string): Promise<void> {
      console.log(`[DocumentService] Attempting to queue enrichment for document ID: ${documentId}`);
      try {
        const rpcParams = {
          p_task_type: 'DOCUMENT_ENRICHMENT',
          p_payload: {
            document_id: documentId,
            timestamp: new Date().toISOString()
          },
          p_priority: 7,
          // ADDED THIS LINE based on previous diagnosis
          p_scheduled_for: new Date().toISOString() 
        };
  
        console.log('[DocumentService] Calling supabaseAdmin.rpc("queue_task") with params:', JSON.stringify(rpcParams, null, 2));
        
        const { data, error } = await supabaseAdmin.rpc('queue_task', rpcParams);
  
        if (error) {
          console.error('[DocumentService] Error calling "queue_task" RPC:', JSON.stringify(error, null, 2));
        } else {
          console.log('[DocumentService] "queue_task" RPC call successful. Response data:', JSON.stringify(data, null, 2));
        }

        // Also queue for text extraction if this is a PDF or image
        await this.queueTextExtraction(documentId);
      } catch (e) {
        console.error('[DocumentService] Exception in queueEnrichment:', e);
      }
    }

    /**
     * Queue document for AWS Textract text extraction
     */
    private async queueTextExtraction(documentId: string): Promise<void> {
      try {
        // Get document and file info - cast to DocumentWithFiles
        const document = await this.getDocumentById(documentId) as DocumentWithFiles;
        if (!document || !document.document_files?.length) {
          console.log('[DocumentService] No document or files found for text extraction');
          return;
        }

        const primaryFile = document.document_files.find((f: any) => f.file_type === 'original');
        if (!primaryFile) {
          console.log('[DocumentService] No original file found for text extraction');
          return;
        }

        // Check if file type supports text extraction
        const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
        if (!supportedTypes.includes(primaryFile.mime_type || '')) {
          console.log(`[DocumentService] File type ${primaryFile.mime_type} not supported for text extraction`);
          return;
        }

        // Process text extraction asynchronously
        this.processDocumentWithTextract(documentId, primaryFile.id);
      } catch (error) {
        console.error('[DocumentService] Error queueing text extraction:', error);
      }
    }

    /**
     * Process a document with AWS Textract asynchronously
     * Compatible with the old documentService functionality
     */
    private async processDocumentWithTextract(documentId: string, fileId: string): Promise<void> {
      try {
        console.log(`[DocumentService] Starting Textract processing for document ${documentId}, file ${fileId}`);
        
        // 1. Get file info from database
        const fileInfo = await supabaseAdmin
          .from('document_files')
          .select('*')
          .eq('id', fileId)
          .single();

        if (fileInfo.error || !fileInfo.data) {
          throw new Error('File not found in database');
        }

        const file = fileInfo.data;
        
        // 2. Download file from S3
        const fileData = await storageService.downloadFile(file.storage_bucket, file.storage_key);
        
        // 3. Extract text using AWS Textract directly from buffer
        console.log(`[DocumentService] Extracting text using Textract`);
        const extractedText = await this.extractTextFromBuffer(fileData.data);

        // 4. Get current document metadata
        const currentDocument = await this.getDocumentById(documentId);
        const currentMetadata = (currentDocument?.metadata as Record<string, any>) || {};

        // 5. Update document with extracted text and mark as completed
        await supabaseAdmin
          .from('documents')
          .update({
            metadata: {
              ...currentMetadata,
              extracted_text: extractedText,
              text_extraction_completed: true,
              text_extraction_date: new Date().toISOString()
            },
            status: 'REGISTERED' // Move to registered status after successful processing
          })
          .eq('id', documentId);

        // 6. Create audit log for text extraction
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'DOCUMENT_TEXT_EXTRACTED',
          p_entity_type: 'document',
          p_entity_id: documentId,
          p_details: {
            file_id: fileId,
            text_length: extractedText.length,
            extraction_method: 'AWS_TEXTRACT'
          }
        });

        console.log(`[DocumentService] Text extraction completed for document ${documentId}`);

      } catch (error) {
        console.error(`[DocumentService] Error processing document ${documentId} with Textract:`, error);
        
        // Get current document metadata for error update
        const currentDocument = await this.getDocumentById(documentId);
        const currentMetadata = (currentDocument?.metadata as Record<string, any>) || {};
        
        // Update document status to indicate processing failed
        await supabaseAdmin
          .from('documents')
          .update({
            status: 'PROCESSING_FAILED',
            metadata: {
              ...currentMetadata,
              text_extraction_error: error instanceof Error ? error.message : 'Unknown error',
              text_extraction_failed_date: new Date().toISOString()
            }
          })
          .eq('id', documentId);

        // Create audit log for failed processing
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'DOCUMENT_TEXT_EXTRACTION_FAILED',
          p_entity_type: 'document',
          p_entity_id: documentId,
          p_details: {
            file_id: fileId,
            error: error instanceof Error ? error.message : 'Unknown error',
            extraction_method: 'AWS_TEXTRACT'
          }
        });
      }
    }

    /**
     * Extract text from buffer using AWS Textract
     */
    private async extractTextFromBuffer(buffer: Buffer): Promise<string> {
      try {
        // Prepare input for Textract
        const command = new DetectDocumentTextCommand({
          Document: {
            Bytes: buffer
          }
        });

        // Call Textract to detect text
        const response = await textractClient.send(command);

        // Process and concatenate the detected text blocks
        let extractedText = '';
        if (response.Blocks) {
          // Filter for LINE type blocks and concatenate their text
          extractedText = response.Blocks
            .filter((block: any) => block.BlockType === 'LINE' && block.Text)
            .map((block: any) => block.Text)
            .join('\n');
        }

        return extractedText;
      } catch (error: any) {
        console.error('Error extracting text from buffer:', error);
        const errorMessage = error.message || 'Unknown error';
        throw new Error(`Failed to extract text: ${errorMessage}`);
      }
    }

    /**
     * Mark document as public
     */
    async makeDocumentPublic(
    documentId: string,
    releaseDate?: string
    ): Promise<Document> {
    return this.updateDocument(
        documentId,
        {
          is_public: true,
          release_date: releaseDate || new Date().toISOString().split('T')[0]
        },
        'system' // Assuming 'system' is a valid userId or identifier for system actions
    )
    }

    /**
     * Get documents pending review
     */
    async getDocumentsPendingReview(): Promise<Document[]> {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabaseAdmin
          .from('documents')
          .select('*')
          .lte('retention_end_date', today)
          .in('status', ['ACTIVE_STORAGE', 'REGISTERED'])
          .order('retention_end_date', { ascending: true })

      if (error) throw error
      return data || []
    }

    /**
     * Delete document (soft delete by changing status)
     */
    async deleteDocument(
    documentId: string,
    reason: string,
    userId: string
    ): Promise<void> {
    await withMonitoring('delete', 'documents', async () => {
        await this.transitionDocumentStatus(
          documentId,
          'DESTROY',
          `Deletion requested by user ${userId}: ${reason}`
        )

        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'DOCUMENT_DELETION_REQUESTED',
          p_entity_type: 'document',
          p_entity_id: documentId,
          p_details: { 
            reason,
            requested_by: userId
           }
        })
    })
    }

    /**
     * Get document statistics for dashboard
     */
    async getDocumentStatistics(): Promise<{
      total: number
      byStatus: Record<string, number>
      byRetention: Record<string, number>
      pendingReview: number
      publicDocuments: number
    }> {
      const { data: statusData } = await supabaseAdmin
          .from('documents')
          .select('status')

      const { data: retentionData } = await supabaseAdmin
          .from('documents')
          .select('retention_category')

      const { count: pendingReview } = await supabaseAdmin
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'REVIEW')

      const { count: publicDocs } = await supabaseAdmin
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true)

      const { count: total } = await supabaseAdmin
          .from('documents')
          .select('*', { count: 'exact', head: true })

      const byStatus: Record<string, number> = {}
      const byRetention: Record<string, number> = {}

      if (statusData) {
          statusData.forEach(doc => {
            if (doc.status) { 
                byStatus[doc.status] = (byStatus[doc.status] || 0) + 1
            }
          })
      }

      if (retentionData) {
          retentionData.forEach(doc => {
            if (doc.retention_category) { 
                byRetention[doc.retention_category] = (byRetention[doc.retention_category] || 0) + 1
            }
          })
      }

      return {
          total: total || 0,
          byStatus,
          byRetention,
          pendingReview: pendingReview || 0,
          publicDocuments: publicDocs || 0
      }
    }

    /**
     * Get documents by user ID (compatibility with old service)
     */
    async getDocumentsByUserId(userId: string): Promise<Document[]> {
      const result = await this.getDocuments({ uploader_user_id: userId });
      return result.documents;
    }
}

export const documentService = new DocumentService();