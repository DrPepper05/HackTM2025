/**
 * Document routes
 */
import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { documentService } from '../services/document.service';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // Default to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, TIFF, JPEG, and PNG files
    const allowedMimeTypes = ['application/pdf', 'image/tiff', 'image/jpeg', 'image/png'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TIFF, JPEG, and PNG files are allowed.'));
    }
  }
});

/**
 * @route   POST /documents
 * @desc    Upload and process a new document
 * @access  Private
 */
router.post('/', authMiddleware, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, document_type, retention_category } = req.body;
    const file = req.file;
    const userId = req.user?.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Convert Express.Multer.File to the format expected by documentService
    const fileData = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    };

    const metadata = {
      title,
      description: description || undefined,
      document_type: document_type || undefined,
      retention_category: retention_category || undefined
    };

    const document = await documentService.createDocument(fileData, metadata, userId);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to upload document' });
  }
});

/**
 * @route   GET /documents
 * @desc    Get all documents for the authenticated user
 * @access  Private
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    console.log('GET /documents - User ID from auth:', userId);
    console.log('GET /documents - Full user object:', req.user);
    
    if (!userId) {
      console.log('GET /documents - No user ID found');
      return res.status(401).json({ error: 'User ID not found' });
    }

    const filters = { uploader_user_id: userId };
    console.log('GET /documents - Applying filters:', filters);
    
    const result = await documentService.getDocuments(filters);
    console.log('GET /documents - Result from service:', {
      documentsCount: result.documents.length,
      total: result.total,
      firstDocUploaderIds: result.documents.slice(0, 3).map(d => d.uploader_user_id)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch documents' });
  }
});

/**
 * @route   GET /documents/:id
 * @desc    Get a document by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if the user has access to this document
    if (document.uploader_user_id && document.uploader_user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch document' });
  }
});

/**
 * @route   DELETE /documents/:id
 * @desc    Delete a document
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if the user has access to delete this document
    if (document.uploader_user_id && document.uploader_user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await documentService.deleteDocument(id, 'User requested deletion', userId);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete document' });
  }
});

export default router;