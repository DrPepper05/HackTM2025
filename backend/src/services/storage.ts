/**
 * File storage service for handling document uploads
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIRECTORY || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Save an uploaded file to the local filesystem
 * @param file The uploaded file object from multer
 * @returns Object containing the saved file information
 */
export const saveFileLocally = async (file: Express.Multer.File) => {
  try {
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Create a write stream and save the file
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write(file.buffer);
    writeStream.end();

    return {
      id: fileId,
      originalName: file.originalname,
      fileName,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size
    };
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload a file to Supabase Storage
 * @param filePath Path to the local file
 * @param fileName Name to use in storage
 * @returns Storage URL of the uploaded file
 */
export const uploadToSupabaseStorage = async (filePath: string, fileName: string): Promise<string> => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(`public/${fileName}`, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase storage error: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(`public/${fileName}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    throw new Error(`Failed to upload to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clean up a local file
 * @param filePath Path to the file to delete
 */
export const cleanupLocalFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
    // Don't throw here, just log the error
  }
};