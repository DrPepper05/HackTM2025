// backend/src/temp-pdf-test.ts
import fs from 'fs/promises';
import path from 'path';
// Make sure the path to pdf.util is correct based on your file structure
import { extractTextFromPDF, extractPDFMetadata, PDFMetadata, PDFTextExtraction } from './utils/pdf.util';

async function testPdfFunctions() {
  try {
    const pdfPath = path.join(__dirname, '..', 'sample.pdf'); // Ensure 'sample.pdf' is in backend root
    console.log(`Reading PDF from: ${pdfPath}`);
    const pdfBuffer = await fs.readFile(pdfPath);

    if (pdfBuffer.length === 0) {
      console.error("Error: PDF file is empty or not found.");
      return;
    }
    console.log(`PDF buffer length: ${pdfBuffer.length}`);

    // Test Text Extraction (from previous step)
    console.log("\nExtracting text...");
    const textResult: PDFTextExtraction = await extractTextFromPDF(pdfBuffer);
    console.log("--- Text Extraction Result ---");
    console.log("Text (first 100 chars):", textResult.text.substring(0, 100) + "...");
    console.log("Pages in text:", textResult.pageTexts.length);
    console.log("Num Pages (from text parser):", textResult.numPages);


    // Test Metadata Extraction (New)
    console.log("\nExtracting metadata...");
    const metadataResult: PDFMetadata = await extractPDFMetadata(pdfBuffer);
    console.log("\n--- Metadata Extraction Result ---");
    console.log("Title:", metadataResult.title);
    console.log("Author:", metadataResult.author);
    console.log("Subject:", metadataResult.subject);
    console.log("Keywords:", metadataResult.keywords);
    console.log("Creator:", metadataResult.creator);
    console.log("Producer:", metadataResult.producer);
    console.log("Creation Date:", metadataResult.creationDate);
    console.log("Modification Date:", metadataResult.modificationDate);
    console.log("PDF Version:", metadataResult.pdfVersion);
    console.log("Page Count:", metadataResult.pageCount);
    console.log("File Size:", metadataResult.fileSize);
    console.log("Is AcroForm Present:", metadataResult.isAcroFormPresent);
    console.log("Is XFA Present:", metadataResult.isXFAPresent);
    console.log("Is Encrypted (placeholder):", metadataResult.isEncrypted);

  } catch (error) {
    console.error("\nTest failed:", error);
  }
}

testPdfFunctions();