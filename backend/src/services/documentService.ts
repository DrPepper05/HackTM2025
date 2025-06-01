/**
 * Document service for handling document processing logic
 */
import { SupabaseDocumentRepository } from '../repositories/documentRepository';
import { extractTextFromDocument } from './textract';
import { saveFileLocally, uploadToSupabaseStorage, cleanupLocalFile } from './storage';
import { Document, CreateDocumentData, DocumentStatus } from '../models/document';

// Create document repository instance
const documentRepository = new SupabaseDocumentRepository();

/**
 * Process and store a document
 * @param file The uploaded file
 * @param title The document title
 * @param userId The ID of the user uploading the document
 */
export const processDocument = async (
  file: Express.Multer.File,
  title: string,
  userId?: string
): Promise<Document> => {
  let localFilePath: string | null = null;

  try {
    // 1. Save file locally
    const savedFile = await saveFileLocally(file);
    localFilePath = savedFile.filePath;

    // 2. Upload to Supabase Storage
    const storagePath = await uploadToSupabaseStorage(savedFile.filePath, savedFile.fileName);

    // 3. Create document record in database
    const documentData: CreateDocumentData = {
      title,
      file_name: savedFile.originalName,
      file_type: savedFile.fileType,
      file_size: savedFile.fileSize,
      storage_path: storagePath,
      created_by: userId
    };

    const document = await documentRepository.create(documentData);

    // 4. Process document with Textract (async)
    processDocumentWithTextract(document.id, savedFile.filePath);

    return document;
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Process a document with AWS Textract asynchronously
 * @param documentId The ID of the document to process
 * @param filePath The path to the local file
 */
const processDocumentWithTextract = async (documentId: string, filePath: string): Promise<void> => {
  try {
    // Extract text from document
    const extractedText = await extractTextFromDocument(filePath);

    // Update document with extracted text
    await documentRepository.update(documentId, {
      extracted_text: extractedText,
      status: DocumentStatus.COMPLETED
    });

    // Clean up local file
    cleanupLocalFile(filePath);
  } catch (error) {
    console.error(`Error processing document ${documentId} with Textract:`, error);
    
    // Update document status to FAILED
    await documentRepository.update(documentId, {
      status: DocumentStatus.FAILED
    });

    // Clean up local file
    if (filePath) {
      cleanupLocalFile(filePath);
    }
  }
};

/**
 * Get a document by ID
 * @param id The document ID
 */
export const getDocumentById = async (id: string): Promise<Document | null> => {
  return await documentRepository.findById(id);
};

/**
 * Get all documents for a user
 * @param userId The user ID
 */
export const getDocumentsByUserId = async (userId: string): Promise<Document[]> => {
  return await documentRepository.findByUserId(userId);
};

/**
 * Delete a document
 * @param id The document ID
 */
export const deleteDocument = async (id: string): Promise<boolean> => {
  return await documentRepository.delete(id);
};