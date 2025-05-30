import { supabaseAdmin, withMonitoring } from '../config/supabase.config'
import { documentService } from './document.service'
import { queueService } from './queue.service'
import { Document, DocumentFile, RetentionCategory } from '../types/database.types'

export interface EnrichmentResult {
  suggestedTitle?: string
  predictedRetention?: RetentionCategory
  detectedPII: PIIDetection[]
  extractedText?: string
  confidence: number
  metadata: Record<string, any>
}

export interface PIIDetection {
  type: 'PERSONAL_ID' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'NAME' | 'FINANCIAL'
  value: string
  confidence: number
  position: { start: number; end: number }
  suggestions?: {
    redactWith: string
    category: 'FULL_REDACT' | 'PARTIAL_REDACT' | 'MASK'
  }
}

export interface OCRResult {
  text: string
  confidence: number
  metadata: {
    language: string
    pageCount: number
    processingTime: number
  }
}

// Type for document with joined files
type DocumentWithFiles = Document & {
  document_files?: DocumentFile[]
}

export class EnrichmentService {
  /**
   * Process a document for enrichment
   */
  async enrichDocument(documentId: string): Promise<EnrichmentResult> {
    return withMonitoring('enrich', 'documents', async () => {
      // Get document and its files
      const document = await documentService.getDocumentById(documentId) as DocumentWithFiles
      if (!document) {
        throw new Error('Document not found')
      }

      // Process all original files
      const enrichmentResults: EnrichmentResult[] = []
      
      if (document.document_files) {
        for (const file of document.document_files) {
          if (file.file_type === 'original') {
            const result = await this.processFile(documentId, file.id)
            enrichmentResults.push(result)
          }
        }
      }

      // Combine results
      const finalResult = this.combineEnrichmentResults(enrichmentResults)

      // Update document with enrichment results
      await this.updateDocumentWithEnrichment(documentId, finalResult)

      // Log enrichment completion
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_ENRICHED',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: {
          suggested_title: finalResult.suggestedTitle,
          predicted_retention: finalResult.predictedRetention,
          pii_count: finalResult.detectedPII.length,
          confidence: finalResult.confidence
        }
      })

      return finalResult
    })
  }

  /**
   * Process individual file for OCR and analysis
   */
  async processFile(documentId: string, fileId: string): Promise<EnrichmentResult> {
    // In a real implementation, this would:
    // 1. Download file from S3
    // 2. Run OCR (Tesseract, AWS Textract, etc.)
    // 3. Run AI analysis for title/retention prediction
    // 4. Run PII detection algorithms

    // Mock implementation for hackathon
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing

    const mockOCRText = this.generateMockOCRText()
    const piiDetections = this.detectPII(mockOCRText)
    const suggestedTitle = this.generateTitleSuggestion(mockOCRText)
    const predictedRetention = this.predictRetentionCategory(mockOCRText)

    // Store OCR text in file record
    await supabaseAdmin
      .from('document_files')
      .update({
        ocr_text: mockOCRText,
        ocr_confidence: 0.95,
        processing_metadata: {
          processed_at: new Date().toISOString(),
          engine: 'mock-ocr',
          language: 'ro'
        }
      })
      .eq('id', fileId)

    return {
      suggestedTitle,
      predictedRetention,
      detectedPII: piiDetections,
      extractedText: mockOCRText,
      confidence: 0.85,
      metadata: {
        fileId,
        processingEngine: 'mock-ai',
        language: 'romanian'
      }
    }
  }

  /**
   * Queue document for enrichment
   */
  async queueDocumentEnrichment(documentId: string, priority: number = 5): Promise<string> {
    return queueService.enqueueTask({
      type: 'DOCUMENT_ENRICHMENT',
      payload: { documentId },
      priority
    })
  }

  /**
   * Generate redacted version of document
   */
  async generateRedactedVersion(
    documentId: string,
    piiToRedact: string[] = ['PERSONAL_ID', 'EMAIL', 'PHONE']
  ): Promise<string> {
    return withMonitoring('redact', 'document_files', async () => {
      const document = await documentService.getDocumentById(documentId) as DocumentWithFiles
      if (!document) {
        throw new Error('Document not found')
      }

      // Get original file with OCR text
      const originalFile = document.document_files?.find((f: DocumentFile) => f.file_type === 'original')
      if (!originalFile?.ocr_text) {
        throw new Error('No OCR text available for redaction')
      }

      // Apply redaction
      const redactedText = this.applyRedaction(originalFile.ocr_text, piiToRedact)

      // Create redacted file record
      const redactedBuffer = Buffer.from(redactedText, 'utf-8')
      
      const redactedFile = await documentService.addDocumentFile(
        documentId,
        {
          buffer: redactedBuffer,
          originalname: `redacted_${originalFile.file_name}`,
          mimetype: 'text/plain',
          size: redactedBuffer.length
        },
        'redacted',
        'system'
      )

      return redactedFile.id
    })
  }

  /**
   * Extract and classify document metadata
   */
  async extractMetadata(text: string): Promise<Record<string, any>> {
    // Mock metadata extraction
    const metadata: Record<string, any> = {
      wordCount: text.split(' ').length,
      language: 'romanian',
      extractedDates: this.extractDates(text),
      extractedNumbers: this.extractNumbers(text),
      documentStructure: {
        hasHeader: text.includes('\n'),
        hasFooter: false,
        pageCount: 1
      }
    }

    // Try to extract contract/legal document specific info
    if (this.isContract(text)) {
      metadata.documentType = 'contract'
      metadata.contractParties = this.extractContractParties(text)
    } else if (this.isDecision(text)) {
      metadata.documentType = 'decision'
      metadata.decisionNumber = this.extractDecisionNumber(text)
    }

    return metadata
  }

  /**
   * Private helper methods
   */
  private generateMockOCRText(): string {
    const templates = [
      `CONTRACT DE ACHIZIȚIE PUBLICĂ
Nr. 12345/2024
Data: 15.03.2024

Contractant: PRIMĂRIA MUNICIPIULUI BUCUREȘTI
CUI: 4267205
Adresa: Bd. Regina Elisabeta nr. 47, Sector 5, București

Furnizor: SC EXAMPLE SRL
CUI: 8765432
Adresa: Str. Exemplu nr. 10, Sector 1, București

Obiectul contractului: Achiziție materiale de curățenie
Valoare: 50.000 RON (fără TVA)`,

      `HOTĂRÂRE
Nr. 245/2024
Data: 20.03.2024

Consiliul Local al Municipiului Cluj-Napoca

În temeiul art. 123 din Legea 215/2001
HOTĂRĂȘTE:

Art. 1. Se aprobă bugetul local pentru anul 2024
Art. 2. Hotărârea intră în vigoare la data adoptării

Primar: Ion POPESCU`,

      `RAPORT DE ACTIVITATE
Data: 01.04.2024
Departament: Resurse Umane

Activități desfășurate în luna martie 2024:
- Recrutare personal nou: 5 persoane
- Evaluări anuale: 25 persoane  
- Formare profesională: 15 cursanți

Contact: hr@example.ro
Telefon: 0721123456`
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  private detectPII(text: string): PIIDetection[] {
    const detections: PIIDetection[] = []

    // Romanian CNP pattern
    const cnpPattern = /\b\d{13}\b/g
    let match
    while ((match = cnpPattern.exec(text)) !== null) {
      detections.push({
        type: 'PERSONAL_ID',
        value: match[0],
        confidence: 0.95,
        position: { start: match.index, end: match.index + match[0].length },
        suggestions: {
          redactWith: 'XXX-XXX-XXX',
          category: 'FULL_REDACT'
        }
      })
    }

    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    while ((match = emailPattern.exec(text)) !== null) {
      detections.push({
        type: 'EMAIL',
        value: match[0],
        confidence: 0.90,
        position: { start: match.index, end: match.index + match[0].length },
        suggestions: {
          redactWith: 'email@redacted.ro',
          category: 'PARTIAL_REDACT'
        }
      })
    }

    // Romanian phone pattern
    const phonePattern = /\b(\+4|04|07)\d{8,9}\b/g
    while ((match = phonePattern.exec(text)) !== null) {
      detections.push({
        type: 'PHONE',
        value: match[0],
        confidence: 0.85,
        position: { start: match.index, end: match.index + match[0].length },
        suggestions: {
          redactWith: '07XX-XXX-XXX',
          category: 'MASK'
        }
      })
    }

    return detections
  }

  private generateTitleSuggestion(text: string): string {
    const firstLines = text.split('\n').slice(0, 3)
    
    for (const line of firstLines) {
      const trimmed = line.trim()
      if (trimmed.length > 10 && trimmed.length < 100) {
        // Clean up common document prefixes
        return trimmed
          .replace(/^(CONTRACT|HOTĂRÂRE|RAPORT|DECIZIE)\s*/i, '')
          .replace(/^Nr\.?\s*\d+\/\d+\s*/i, '')
          .trim()
      }
    }

    return 'Document fără titlu identificat'
  }

  private predictRetentionCategory(text: string): RetentionCategory {
    const lowerText = text.toLowerCase()
    
    // Permanent retention indicators
    if (lowerText.includes('constituțional') || 
        lowerText.includes('patrimoniu') ||
        lowerText.includes('arhivă națională')) {
      return 'permanent'
    }
    
    // 30 year retention indicators
    if (lowerText.includes('contract') || 
        lowerText.includes('hotărâre') ||
        lowerText.includes('decizie')) {
      return '30y'
    }
    
    // Default to 10 years
    return '10y'
  }

  private combineEnrichmentResults(results: EnrichmentResult[]): EnrichmentResult {
    if (results.length === 0) {
      return {
        detectedPII: [],
        confidence: 0,
        metadata: {}
      }
    }

    const combined: EnrichmentResult = {
      detectedPII: [],
      confidence: 0,
      metadata: {}
    }

    // Take the best title suggestion
    const titledResult = results.find(r => r.suggestedTitle)
    if (titledResult) {
      combined.suggestedTitle = titledResult.suggestedTitle
    }

    // Take the most confident retention prediction
    const retentionResult = results
      .filter(r => r.predictedRetention)
      .sort((a, b) => b.confidence - a.confidence)[0]
    if (retentionResult) {
      combined.predictedRetention = retentionResult.predictedRetention
    }

    // Combine all PII detections
    results.forEach(result => {
      combined.detectedPII.push(...result.detectedPII)
    })

    // Average confidence
    combined.confidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

    // Combine metadata
    results.forEach(result => {
      Object.assign(combined.metadata, result.metadata)
    })

    return combined
  }

  private async updateDocumentWithEnrichment(
    documentId: string, 
    enrichment: EnrichmentResult
  ): Promise<void> {
    await supabaseAdmin
      .from('documents')
      .update({
        ai_suggested_title: enrichment.suggestedTitle,
        ai_predicted_retention: enrichment.predictedRetention,
        ai_detected_pii: enrichment.detectedPII,
        metadata: {
          ...enrichment.metadata,
          enrichment_completed_at: new Date().toISOString(),
          enrichment_confidence: enrichment.confidence
        }
      })
      .eq('id', documentId)
  }

  private applyRedaction(text: string, piiTypes: string[]): string {
    let redactedText = text

    // This is a simplified redaction - in production you'd use the actual PII positions
    if (piiTypes.includes('PERSONAL_ID')) {
      redactedText = redactedText.replace(/\b\d{13}\b/g, 'XXX-XXX-XXX')
    }
    
    if (piiTypes.includes('EMAIL')) {
      redactedText = redactedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'email@redacted.ro')
    }
    
    if (piiTypes.includes('PHONE')) {
      redactedText = redactedText.replace(/\b(\+4|04|07)\d{8,9}\b/g, '07XX-XXX-XXX')
    }

    return redactedText
  }

  private extractDates(text: string): string[] {
    const datePattern = /\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/g
    return Array.from(text.matchAll(datePattern), m => m[0])
  }

  private extractNumbers(text: string): string[] {
    const numberPattern = /\bNr\.?\s*(\d+\/\d+|\d+)\b/gi
    return Array.from(text.matchAll(numberPattern), m => m[1])
  }

  private isContract(text: string): boolean {
    return /\bcontract\b/i.test(text)
  }

  private isDecision(text: string): boolean {
    return /\b(hotărâre|decizie)\b/i.test(text)
  }

  private extractContractParties(text: string): string[] {
    // Simplified extraction
    const parties = []
    const contractorPattern = /Contractant:\s*([^\n]+)/i
    const supplierPattern = /Furnizor:\s*([^\n]+)/i
    
    const contractorMatch = text.match(contractorPattern)
    if (contractorMatch) parties.push(contractorMatch[1].trim())
    
    const supplierMatch = text.match(supplierPattern)
    if (supplierMatch) parties.push(supplierMatch[1].trim())
    
    return parties
  }

  private extractDecisionNumber(text: string): string | null {
    const numberPattern = /Nr\.?\s*(\d+\/\d+)/i
    const match = text.match(numberPattern)
    return match ? match[1] : null
  }
}

export const enrichmentService = new EnrichmentService() 