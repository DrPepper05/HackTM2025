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
      
      // 2. Start transaction-like operation
      let documentId: string | null = null
      let fileId: string | null = null
      let s3Key: string | null = null

      try {
        // 3. Create document record
        const { data: document, error: docError } = await supabaseAdmin
          .from('documents')
          .insert({
            title: metadata.title,
            description: metadata.description,
            document_type: metadata.document_type,
            document_number: metadata.document_number,
            creator_info: metadata.creator_info || {},
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

        // 4. Generate S3 key (prepare for future S3 upload)
        s3Key = generateS3Key(file.originalname, documentId!, 'original')

        // 5. Upload to S3 (mocked for now)
        const uploadResult = await storageService.uploadFile(
          S3_BUCKETS.DOCUMENTS,
          s3Key,
          file.buffer,
          {
            'content-type': file.mimetype,
            'document-id': documentId!,
            'uploaded-by': userId
          }
        )

        // Upload successful if no error thrown

        // 6. Create file record
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

        // 7. Queue for enrichment
        await this.queueEnrichment(documentId!)

        // 8. Create audit log
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
        // Rollback operations
        if (fileId) {
          await supabaseAdmin
            .from('document_files')
            .delete()
            .eq('id', fileId)
        }
        
        if (documentId) {
          await supabaseAdmin
            .from('documents')
            .delete()
            .eq('id', documentId)
        }

        if (s3Key) {
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
        let query = supabaseAdmin
            .from('documents')
            .select('*, document_files(*)', { count: 'exact' })

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        // Continue applying filters
        if (filters.is_public !== undefined) {
            query = query.eq('is_public', filters.is_public)
            }

            if (filters.retention_category) {
            query = query.eq('retention_category', filters.retention_category)
            }

            if (filters.uploader_user_id) {
            query = query.eq('uploader_user_id', filters.uploader_user_id)
            }

            if (filters.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags)
            }

            if (filters.from_date) {
            query = query.gte('created_at', filters.from_date)
            }

            if (filters.to_date) {
            query = query.lte('created_at', filters.to_date)
            }

            // Full-text search
            if (filters.search) {
            query = query.textSearch('search_vector', filters.search, {
                type: 'websearch',
                config: 'romanian'
            })
            }

            // Pagination
            const limit = filters.limit || 20
            const offset = filters.offset || 0
            query = query.range(offset, offset + limit - 1)

            // Order by created_at desc by default
            query = query.order('created_at', { ascending: false })

            const { data, error, count } = await query

            if (error) throw error

            return {
            documents: data || [],
            total: count || 0
            }
    })
}

    /**
     * Get single document by ID
     */
    async getDocumentById(documentId: string): Promise<Document | null> {
    return withMonitoring('get', 'documents', async () => {
        const { data, error } = await supabaseAdmin
        .from('documents')
        .select('*, document_files(*)')
        .eq('id', documentId)
        .single()

        if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
        }

        return data
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
        // Get current document state for audit
        const { data: currentDoc } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

        if (!currentDoc) {
        throw new Error('Document not found')
        }

        // Update document
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

        // Log the update
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
        // Verify document exists
        const document = await this.getDocumentById(documentId)
        if (!document) {
        throw new Error('Document not found')
        }

        // Calculate checksum
        const checksum = createHash('sha256').update(file.buffer).digest('hex')

        // Generate S3 key
        const s3Key = generateS3Key(file.originalname, documentId, 'original')

        // Upload to S3 (mocked)
        const uploadResult = await storageService.uploadFile(
        S3_BUCKETS.DOCUMENTS,
        s3Key,
        file.buffer,
        {
            'content-type': file.mimetype,
            'document-id': documentId,
            'file-type': fileType
        }
        )

        // Upload successful if no error thrown

        // Create file record
        const { data, error } = await supabaseAdmin
        .from('document_files')
        .insert({
            document_id: documentId,
            file_type: fileType,
            file_name: file.originalname,
            storage_bucket: S3_BUCKETS.DOCUMENTS,
            storage_key: s3Key,
            mime_type: file.mimetype,
            checksum,
            file_size: file.size
        })
        .select()
        .single()

        if (error) throw error

        // Log file addition
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
    // Get file record
    const { data: file, error } = await supabaseAdmin
        .from('document_files')
        .select('*')
        .eq('id', fileId)
        .single()

    if (error || !file) {
        throw new Error('File not found')
    }

    // Generate presigned URL from S3 (mocked)
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
    await supabaseAdmin.rpc('queue_task', {
        p_task_type: 'DOCUMENT_ENRICHMENT',
        p_payload: {
        document_id: documentId,
        timestamp: new Date().toISOString()
        },
        p_priority: 7 // Medium-high priority
    })
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
        'system'
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
        // First transition to DESTROY status
        await this.transitionDocumentStatus(
        documentId,
        'DESTROY',
        `Deletion requested by user ${userId}: ${reason}`
        )

        // Log deletion request
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
    // Get counts by status - using proper aggregation
    const { data: statusData } = await supabaseAdmin
        .from('documents')
        .select('status')

    // Get counts by retention category
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

    // Process results to create counts
    const byStatus: Record<string, number> = {}
    const byRetention: Record<string, number> = {}

    // Count status occurrences
    if (statusData) {
        statusData.forEach(doc => {
        if (doc.status) {
            byStatus[doc.status] = (byStatus[doc.status] || 0) + 1
        }
        })
    }

    // Count retention category occurrences
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
}

// Export singleton instance
export const documentService = new DocumentService()