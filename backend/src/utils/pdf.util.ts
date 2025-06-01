// PDF utility for Romanian government document management
// backend/src/utils/pdf.util.ts
import pdf, { Result } from 'pdf-parse'; // Ensure this import is present

// Helper function to parse PDF date strings (e.g., "D:20240101120000Z")
function parsePdfDate(pdfDate?: string): Date | undefined {
  if (!pdfDate) return undefined;
  // Remove "D:" prefix if present
  const dateStr = pdfDate.startsWith('D:') ? pdfDate.substring(2) : pdfDate;

  // Basic parsing: YYYYMMDDHHMMSS
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1; // Month is 0-indexed
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = parseInt(dateStr.substring(8, 10), 10) || 0;
  const minute = parseInt(dateStr.substring(10, 12), 10) || 0;
  const second = parseInt(dateStr.substring(12, 14), 10) || 0;

  // Handle timezone offset if present (e.g., Z, +HH'MM', -HH'MM')
  // This is a simplified parser; a robust one would handle all PDF date formats.
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;

  // Assuming UTC if 'Z' is present or no offset specified after seconds
  if (dateStr.length > 14 && dateStr.charAt(14).toUpperCase() === 'Z') {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  // For simplicity, treat as local time if no 'Z' or specific offset parsing implemented
  return new Date(year, month, day, hour, minute, second);
}


export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string; // Changed from string[] to string, as pdf-parse gives a single string
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pdfVersion?: string; // e.g., "1.4", "1.7"
  isAcroFormPresent?: boolean;
  isXFAPresent?: boolean;
  isEncrypted?: boolean; // From pdf-parse's internal check (not directly in info)
  pageCount: number; // From pdf-parse's numpages
  fileSize: number; // Will be passed in from buffer length
}

export interface PDFTextExtraction { // This was defined in the previous step
  text: string;
  pageTexts: string[];
  numPages: number;
  numRenders: number;
  info: any;
  metadata: any; // Raw PDF metadata from pdf-parse
  version: string; // PDF version from pdf-parse
  confidence: number;
  processingTimeMs: number;
  language?: string;
}



export interface PDFThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png'
  page?: number // Which page to use for thumbnail (1-indexed)
}

export interface PDFRedactionOptions {
  searchTerms: string[]
  replacementText?: string
  caseSensitive?: boolean
  wholeWordsOnly?: boolean
}

/**
 * Extract metadata from PDF buffer
 */
export async function extractPDFMetadata(pdfBuffer: Buffer): Promise<PDFMetadata> {
  try {
    const data: Result = await pdf(pdfBuffer, {
      // We can limit to parsing only metadata if we don't need the text here
      // However, pdf-parse typically parses content to get some metadata too.
      // For this specific function, we might not need to pass a `max` pages option
      // if we only care about the metadata, but often metadata is tied to parsing some content.
    });

    const info = data.info || {}; // data.info contains the /Info dictionary
    // data.metadata might contain XMP metadata, for simplicity we focus on data.info

    // Helper to safely access potentially undefined string properties from info
    const getString = (obj: any, key: string): string | undefined => {
        return typeof obj[key] === 'string' ? obj[key] : undefined;
    };

    return {
      title: getString(info, 'Title'),
      author: getString(info, 'Author'),
      subject: getString(info, 'Subject'),
      keywords: getString(info, 'Keywords'), // Keywords from PDF info are usually a single string
      creator: getString(info, 'Creator'),
      producer: getString(info, 'Producer'),
      creationDate: parsePdfDate(getString(info, 'CreationDate')),
      modificationDate: parsePdfDate(getString(info, 'ModDate') || getString(info, 'ModDate')), // ModDate is common
      pdfVersion: data.version || getString(info, 'PDFFormatVersion'), // data.version is preferred
      isAcroFormPresent: info.IsAcroFormPresent === 'true' || info.IsAcroFormPresent === true,
      isXFAPresent: info.IsXFAPresent === 'true' || info.IsXFAPresent === true,
      // isEncrypted: data.encrypted, // pdf-parse's `data.encrypted` field if available & accurate.
                                     // However, `pdf-parse` doesn't explicitly expose an `encrypted` boolean in its `Result` type.
                                     // A more robust check would involve trying to parse with a known password or analyzing PDF structure.
                                     // For now, we'll default or omit if not directly available.
                                     // Let's assume it's not encrypted if parsing succeeds without password.
      isEncrypted: false, // Placeholder - a more reliable check is needed if this is critical.
      pageCount: data.numpages,
      fileSize: pdfBuffer.length,
    };
  } catch (error) {
    console.error("Error extracting metadata from PDF:", error);
    // Fallback or throw error
    return {
        pageCount: 0,
        fileSize: pdfBuffer.length,
        isEncrypted: false, // Default on error
    };
  }
}


/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFTextExtraction> {
  const startTime = Date.now();
  try {
    const data: Result = await pdf(pdfBuffer);

    // pdf-parse provides text for all pages combined in `data.text`
    // It also provides `data.numpages`
    // To get text per page, one might need a more advanced library or a different approach
    // if pdf-parse doesn't directly offer it. For now, we'll put all text in pageTexts[0]
    // or split by a common page break indicator if one exists in `data.text` (less reliable).
    // A simpler approach for `pageTexts` with pdf-parse is to consider the whole text as one page
    // or acknowledge this limitation. Let's try to naively split by form feed character (\f) if present.

    const pageTexts = data.text.split(/\f/).map(pageText => pageText.trim()).filter(Boolean);

    const processingTimeMs = Date.now() - startTime;

    return {
      text: data.text.trim(),
      pageTexts: pageTexts.length > 0 ? pageTexts : [data.text.trim()], // Ensure pageTexts is not empty
      numPages: data.numpages,
      numRenders: data.numrender,
      info: data.info, // Raw PDF metadata (author, title, keywords, etc.)
      metadata: data.metadata, // Raw document metadata (if different from info)
      version: data.version,
      confidence: 0.9, // pdf-parse doesn't directly provide a confidence score for the whole text.
                       // This would typically come from an OCR engine if it were image-based.
                       // For text-based PDFs, extraction is usually accurate.
      processingTimeMs,
      language: 'ro', // Language detection is a separate, more complex task. Defaulting to 'ro'.
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    const processingTimeMs = Date.now() - startTime;
    // Return a structure indicating failure or partial data
    return {
        text: '',
        pageTexts: [],
        numPages: 0,
        numRenders: 0,
        info: null,
        metadata: null,
        version: '',
        confidence: 0,
        processingTimeMs,
        language: 'ro',
    };
  }
}


/**
 * Generate thumbnail from PDF
 */
export async function generatePDFThumbnail(
  pdfBuffer: Buffer,
  options: PDFThumbnailOptions = {}
): Promise<Buffer> {
  const {
    width = 200,
    height = 300,
    quality = 80,
    format = 'jpeg',
    page = 1
  } = options

  // Mock implementation
  // In production, use pdf2pic, puppeteer, or similar
  
  const mockThumbnail = Buffer.from(`mock-${format}-thumbnail-data-${width}x${height}-page${page}`)
  
  return mockThumbnail
}

/**
 * Create redacted version of PDF
 */
export async function redactPDF(
  pdfBuffer: Buffer,
  options: PDFRedactionOptions
): Promise<Buffer> {
  const { searchTerms, replacementText = '████', caseSensitive = false } = options

  // Mock implementation
  // In production, use pdf-lib, PDFtk, or similar
  
  console.log(`Redacting PDF with terms: ${searchTerms.join(', ')}`)
  console.log(`Replacement text: ${replacementText}`)
  console.log(`Case sensitive: ${caseSensitive}`)

  // Return mock redacted PDF
  const mockRedactedPDF = Buffer.from('mock-redacted-pdf-data')
  return mockRedactedPDF
}

/**
 * Validate PDF structure and integrity
 */
export async function validatePDF(pdfBuffer: Buffer): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: PDFMetadata
}> {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validation checks
  if (pdfBuffer.length === 0) {
    errors.push('PDF buffer is empty')
  }

  if (!pdfBuffer.subarray(0, 4).toString().includes('%PDF')) {
    errors.push('Invalid PDF header')
  }

  if (pdfBuffer.length < 1024) {
    warnings.push('PDF file is unusually small')
  }

  const isValid = errors.length === 0

  let metadata: PDFMetadata | undefined
  if (isValid) {
    try {
      metadata = await extractPDFMetadata(pdfBuffer)
    } catch (error) {
      warnings.push('Could not extract metadata')
    }
  }

  return {
    isValid,
    errors,
    warnings,
    metadata
  }
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
  // Mock implementation
  // In production, use pdf-lib or similar
  
  if (pdfBuffers.length === 0) {
    throw new Error('No PDFs to merge')
  }

  console.log(`Merging ${pdfBuffers.length} PDFs`)
  
  // Calculate total size
  const totalSize = pdfBuffers.reduce((sum, buffer) => sum + buffer.length, 0)
  
  // Return mock merged PDF
  const mockMergedPDF = Buffer.alloc(totalSize, 'mock-merged-pdf-data')
  return mockMergedPDF
}

/**
 * Split PDF into individual pages
 */
export async function splitPDF(pdfBuffer: Buffer): Promise<Buffer[]> {
  // Mock implementation
  // In production, use pdf-lib or similar
  
  const metadata = await extractPDFMetadata(pdfBuffer)
  const pageBuffers: Buffer[] = []
  
  // Create mock page buffers
  for (let i = 0; i < metadata.pageCount; i++) {
    const pageBuffer = Buffer.from(`mock-pdf-page-${i + 1}-data`)
    pageBuffers.push(pageBuffer)
  }
  
  return pageBuffers
}

/**
 * Add watermark to PDF
 */
export async function addWatermarkToPDF(
  pdfBuffer: Buffer,
  watermarkText: string,
  options: {
    opacity?: number
    fontSize?: number
    color?: string
    rotation?: number
  } = {}
): Promise<Buffer> {
  const { opacity = 0.3, fontSize = 50, color = 'gray', rotation = 45 } = options

  // Mock implementation
  console.log(`Adding watermark "${watermarkText}" to PDF`)
  console.log(`Options: opacity=${opacity}, fontSize=${fontSize}, color=${color}, rotation=${rotation}`)
  
  // Return mock watermarked PDF
  const mockWatermarkedPDF = Buffer.from('mock-watermarked-pdf-data')
  return mockWatermarkedPDF
}

/**
 * Optimize PDF for archival storage
 */
export async function optimizePDFForArchival(pdfBuffer: Buffer): Promise<{
  optimizedPDF: Buffer
  compressionRatio: number
  originalSize: number
  optimizedSize: number
}> {
  const originalSize = pdfBuffer.length
  
  // Mock optimization
  // In production, use ghostscript, pdf-lib optimization, or similar
  const compressionRatio = 0.7 // 30% size reduction
  const optimizedSize = Math.floor(originalSize * compressionRatio)
  
  const optimizedPDF = Buffer.alloc(optimizedSize, 'mock-optimized-pdf-data')
  
  return {
    optimizedPDF,
    compressionRatio,
    originalSize,
    optimizedSize
  }
}

/**
 * Extract images from PDF
 */
export async function extractImagesFromPDF(pdfBuffer: Buffer): Promise<Array<{
  imageBuffer: Buffer
  format: string
  width: number
  height: number
  pageNumber: number
}>> {
  // Mock implementation
  const metadata = await extractPDFMetadata(pdfBuffer)
  const images: Array<{
    imageBuffer: Buffer
    format: string
    width: number
    height: number
    pageNumber: number
  }> = []
  
  // Mock extract 1-2 images per page
  for (let page = 1; page <= metadata.pageCount; page++) {
    const imageCount = Math.random() > 0.5 ? 1 : 0
    
    for (let img = 0; img < imageCount; img++) {
      images.push({
        imageBuffer: Buffer.from(`mock-image-page-${page}-img-${img}`),
        format: 'jpeg',
        width: 800,
        height: 600,
        pageNumber: page
      })
    }
  }
  
  return images
}

/**
 * Helper function to extract title from PDF buffer (mock)
 */
function extractTitleFromBuffer(buffer: Buffer): string {
  // Very basic mock title extraction
  const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 1000))
  
  if (bufferString.includes('CONTRACT')) return 'Contract Guvernamental'
  if (bufferString.includes('ORDIN')) return 'Ordin Ministerial'
  if (bufferString.includes('HOTĂRÂRE')) return 'Hotărâre de Guvern'
  if (bufferString.includes('LEGE')) return 'Lege'
  if (bufferString.includes('DECIZIE')) return 'Decizie Administrativă'
  
  return 'Document Oficial'
}

/**
 * Generate mock PDF text content
 */
function generateMockPDFText(buffer: Buffer): string {
  const fileSize = buffer.length
  const titleHint = extractTitleFromBuffer(buffer)
  
  return `${titleHint}

GUVERNUL ROMÂNIEI
MINISTERUL ADMINISTRAȚIEI ȘI INTERNELOR

Document Nr. ${Math.floor(Math.random() * 10000)}
Data: ${new Date().toLocaleDateString('ro-RO')}

Conținutul acestui document oficial conține informații importante pentru administrația publică română.

Text extras din document PDF cu dimensiunea de ${Math.floor(fileSize / 1024)} KB.

Acest document a fost procesat de sistemul OpenArchive pentru arhivarea digitală.

Conform legislației în vigoare, documentele oficiale trebuie păstrate pentru perioada de retenție specificată în nomenclatorul arhivistic.

- Informații generale despre document
- Metadata extrasă automat
- Text procesat prin OCR
- Verificare integritate completă

Data procesării: ${new Date().toISOString()}
Sistem: OpenArchive v1.0
Status: Document valid și verificat

Sfârșitul documentului.`
} 