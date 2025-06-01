import { Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { supabaseAdmin } from '../config/supabase.config';
import { documentService } from '../services';

export class PublicController {
  /**
   * Get public document count
   */
  getPublicDocumentCount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { count } = await supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact', head: true });

      res.json({
        success: true,
        data: {
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Error getting document count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get document count'
      });
    }
  });

  /**
   * Download public document file
   */
  downloadPublicDocument = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;

    try {
      // Check if document exists and is public
      const { data: document, error: docError } = await supabaseAdmin
        .from('documents')
        .select('id, is_public, title')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (!document.is_public) {
        return res.status(403).json({
          success: false,
          message: 'Document is not publicly available'
        });
      }

      // Get the primary document file (original file)
      const { data: files, error: filesError } = await supabaseAdmin
        .from('document_files')
        .select('*')
        .eq('document_id', documentId)
        .eq('file_type', 'original')
        .limit(1);

      if (filesError || !files || files.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found'
        });
      }

      const file = files[0];

      // Generate download URL
      const downloadUrl = await documentService.getFileDownloadUrl(file.id, 3600);

      // Log public download
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'PUBLIC_DOCUMENT_DOWNLOAD',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: {
          file_id: file.id,
          file_name: file.file_name,
          download_url: downloadUrl
        }
      });

      // Redirect to the download URL
      res.redirect(downloadUrl);
    } catch (error) {
      console.error('Error downloading public document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document'
      });
    }
  });

  /**
   * Get all documents list (for public access)
   */
  getPublicDocuments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const { data: documents, error, count } = await supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          documents: documents || [],
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Error getting documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get documents'
      });
    }
  });
}

export const publicController = new PublicController(); 