/**
 * AWS Textract service for document processing
 */
import {
  TextractClient,
  DetectDocumentTextCommand,
  DetectDocumentTextCommandInput,
  TextractClientConfig
} from '@aws-sdk/client-textract';

import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Missing AWS environment variables. Please check your .env file.');
}

// Create Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Extract text from a document using AWS Textract
 * @param filePath Path to the document file
 * @returns Extracted text from the document
 */
export const extractTextFromDocument = async (filePath: string): Promise<string> => {
  try {
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Prepare input for Textract
    const params: DetectDocumentTextCommandInput = {
      Document: {
        Bytes: fileBuffer
      }
    };

    // Call Textract to detect text
    const command = new DetectDocumentTextCommand(params);
    const response = await textractClient.send(command);

    // Process and concatenate the detected text blocks
    let extractedText = '';
    if (response.Blocks) {
      // Filter for LINE type blocks and concatenate their text
      extractedText = response.Blocks
        .filter(block => block.BlockType === 'LINE' && block.Text)
        .map(block => block.Text)
        .join('\n');
    }

    return extractedText;
  } catch (error: any) {
    console.error('Error extracting text from document:', error);
    const errorMessage = error.message || 'Unknown error';
    throw new Error(`Failed to extract text: ${errorMessage}`);
  }
};

/**
 * Extract text from a document using AWS Textract with async processing
 * This is a simplified version. For production, you would use StartDocumentTextDetection
 * and GetDocumentTextDetection for async processing of larger documents.
 */
export const processDocumentAsync = async (filePath: string): Promise<string> => {
  try {
    // For the hackathon, we'll use the synchronous API for simplicity
    // In a production environment, you would implement the async API with SNS/SQS
    return await extractTextFromDocument(filePath);
  } catch (error: any) {
    console.error('Error in async document processing:', error);
    const errorMessage = error.message || 'Unknown error';
    throw new Error(`Failed to process document: ${errorMessage}`);
  }
};