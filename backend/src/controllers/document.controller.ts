import { Request, Response } from 'express'
import { documentService, enrichmentService, lifecycleService } from '../services'
import { asyncHandler } from '../middleware'
import multer from 'multer'
import { supabaseAdmin } from '../config/supabase.config'

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1 // Single file for document creation
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  }
}).single('file')

export class DocumentController {
  /**
   * Create new document with file upload
   */
  createDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      console.log('🔐 User ID:', userId);
  
      // Handle file upload using multer
      await new Promise<void>((resolve, reject) => {
        upload(req, res, (err) => {
          if (err) {
            console.error('❌ Multer error:', err);
            return reject(err);
          }
          resolve();
        });
      });
  
      const file = req.file;
      if (!file) {
        console.error('⚠️ No file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }
  
      const {
        title,
        description,
        document_type,
        retention_category,
        tags,
        creation_date,
        is_public = false,
      } = req.body;
  
      let parsedTags;
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (err) {
        console.error('⚠️ Invalid tags format');
        return res.status(400).json({
          success: false,
          message: 'Invalid tags format',
        });
      }
  
      const metadata = {
        title,
        description,
        document_type,
        retention_category,
        tags: parsedTags,
        creation_date,
        is_public,
      };
  
      console.log('📄 Metadata:', metadata);
      console.log('📎 File uploaded:', file.originalname);
  
      const document = await documentService.createDocument(file, metadata, userId);
  
      return res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: document,
      });
    } catch (error) {
      console.error('💥 Internal error in createDocument:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  })

  /**
   * Get document by ID
   */
  getDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const document = await documentService.getDocumentById(id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }

    res.json({
      success: true,
      data: document
    })
  })

  /**
   * Update document metadata
   */
  updateDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.userId!
    const updates = req.body

    const updatedDocument = await documentService.updateDocument(id, updates, userId)

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    })
  })

//   /**
//    * Delete document
//    */
//   deleteDocument = asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params
//     const userId = req.userId!

//     await documentService.deleteDocument(id, userId)

//     res.json({
//       success: true,
//       message: 'Document deleted successfully'
//     })
//   })

  /**
   * Get documents with filters and pagination
   */
  getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { search, limit = 20, offset = 0 } = req.query

    const filters = {
      search: search as string,
      limit: Number(limit),
      offset: Number(offset)
    }

    const result = await documentService.getDocuments(filters)

    res.json({
      success: true,
      data: result
    })
  })

//   /**
//    * Download document file
//    */
//   downloadFile = asyncHandler(async (req: Request, res: Response) => {
//     const { documentId, fileId } = req.params
//     const userId = req.userId

//     const { fileData, metadata } = await documentService.downloadDocumentFile(
//       documentId,
//       fileId,
//       userId
//     )

//     // Set appropriate headers
//     res.set({
//       'Content-Type': metadata.mimetype,
//       'Content-Length': metadata.size.toString(),
//       'Content-Disposition': `attachment; filename="${metadata.filename}"`,
//       'Cache-Control': 'private, max-age=3600'
//     })

//     res.send(fileData)
//   })

//   /**
//    * Generate document preview/thumbnail
//    */
//   generatePreview = asyncHandler(async (req: Request, res: Response) => {
//     const { documentId, fileId } = req.params
//     const userId = req.userId!

//     const preview = await documentService.generateDocumentPreview(
//       documentId,
//       fileId,
//       userId
//     )

//     res.json({
//       success: true,
//       message: 'Preview generated successfully',
//       data: preview
//     })
//   })

  /**
   * Get document statistics
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await documentService.getDocumentStatistics()

    res.json({
      success: true,
      data: stats
    })
  })

  /**
   * Process document for enrichment
   */
  processEnrichment = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params

    const result = await enrichmentService.enrichDocument(documentId)

    res.json({
      success: true,
      message: 'Document enrichment completed',
      data: result
    })
  })

  /**
   * Generate redacted version
   */
  generateRedacted = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params
    const { pii_types = ['PERSONAL_ID', 'EMAIL', 'PHONE'] } = req.body

    const redactedFileId = await enrichmentService.generateRedactedVersion(
      documentId,
      pii_types
    )

    res.json({
      success: true,
      message: 'Redacted version generated',
      data: { redacted_file_id: redactedFileId }
    })
  })

  /**
   * Queue document for lifecycle action
   */
  scheduleLifecycleAction = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params
    const { action, reason } = req.body

    if (action === 'transfer') {
      await lifecycleService.queueForTransfer(documentId, reason)
    } else if (action === 'destroy') {
      await lifecycleService.scheduleDestruction(documentId, reason)
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid lifecycle action'
      })
    }

    res.json({
      success: true,
      message: `Document scheduled for ${action}`
    })
  })

//   /**
//    * Bulk operations on documents
//    */
//   bulkOperation = asyncHandler(async (req: Request, res: Response) => {
//     const userId = req.userId!
//     const { document_ids, operation, data } = req.body

//     if (!Array.isArray(document_ids) || document_ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Document IDs array is required'
//       })
//     }

//     const result = await documentService.bulkUpdateDocuments(
//       document_ids,
//       operation,
//       data,
//       userId
//     )

//     res.json({
//       success: true,
//       message: 'Bulk operation completed',
//       data: result
//     })
//   })

  /**
   * Get document count statistics
   */
  getDocumentCount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { data: documents, error } = await supabaseAdmin
        .from('documents')
        .select('status, document_type, is_public');

      if (error) {
        throw error;
      }

      const stats = {
        total: documents.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        public: 0,
        private: 0
      };

      documents.forEach((doc: { status?: string; document_type?: string; is_public?: boolean }) => {
        // Count by status
        if (doc.status) {
          stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
        }

        // Count by document type
        if (doc.document_type) {
          stats.byType[doc.document_type] = (stats.byType[doc.document_type] || 0) + 1;
        }

        // Count public vs private
        if (doc.is_public) {
          stats.public++;
        } else {
          stats.private++;
        }
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting document count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get document count'
      });
    }
  });
}

export const documentController = new DocumentController() 