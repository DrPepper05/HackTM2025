/**
 * Document routes
 */
import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  processDocument,
  getDocumentById,
  getDocumentsByUserId,
  deleteDocument
} from '../services/documentService';

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
    const { title } = req.body;
    const file = req.file;
    const userId = req.user?.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const document = await processDocument(file, title, userId);
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
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const documents = await getDocumentsByUserId(userId);
    res.json(documents);
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
    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if the user has access to this document
    if (document.created_by && document.created_by !== req.user?.id) {
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
    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if the user has access to delete this document
    if (document.created_by && document.created_by !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await deleteDocument(id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete document' });
  }
});

export default router;