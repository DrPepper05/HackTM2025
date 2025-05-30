// Validation utilities for Romanian government document management system

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  
  if (!email) {
    errors.push('Email este obligatoriu')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Format email invalid')
    }
    
    if (email.length > 255) {
      errors.push('Email-ul este prea lung (max 255 caractere)')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!password) {
    errors.push('Parola este obligatorie')
  } else {
    if (password.length < 8) {
      errors.push('Parola trebuie să aibă minim 8 caractere')
    }
    
    if (password.length > 128) {
      errors.push('Parola este prea lungă (max 128 caractere)')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Parola trebuie să conțină cel puțin o literă mare')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Parola trebuie să conțină cel puțin o literă mică')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Parola trebuie să conțină cel puțin o cifră')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push('Parola ar trebui să conțină cel puțin un caracter special')
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'parola']
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Parola este prea comună și ușor de ghicit')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate Romanian CNP (Cod Numeric Personal)
 */
export function validateCNP(cnp: string): ValidationResult {
  const errors: string[] = []
  
  if (!cnp) {
    errors.push('CNP este obligatoriu')
    return { isValid: false, errors }
  }
  
  // Remove any spaces or dashes
  const cleanCNP = cnp.replace(/[\s-]/g, '')
  
  // Check length
  if (cleanCNP.length !== 13) {
    errors.push('CNP trebuie să aibă 13 cifre')
    return { isValid: false, errors }
  }
  
  // Check if all characters are digits
  if (!/^\d{13}$/.test(cleanCNP)) {
    errors.push('CNP trebuie să conțină doar cifre')
    return { isValid: false, errors }
  }
  
  // Validate first digit (sex and century)
  const firstDigit = parseInt(cleanCNP[0])
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(firstDigit)) {
    errors.push('Prima cifră a CNP-ului este invalidă')
  }
  
  // Validate date
  const year = parseInt(cleanCNP.substring(1, 3))
  const month = parseInt(cleanCNP.substring(3, 5))
  const day = parseInt(cleanCNP.substring(5, 7))
  
  if (month < 1 || month > 12) {
    errors.push('Luna din CNP este invalidă')
  }
  
  if (day < 1 || day > 31) {
    errors.push('Ziua din CNP este invalidă')
  }
  
  // Validate county code
  const county = parseInt(cleanCNP.substring(7, 9))
  if (county < 1 || county > 52) {
    errors.push('Codul de județ din CNP este invalid')
  }
  
  // Validate control digit
  const controlDigit = calculateCNPControlDigit(cleanCNP.substring(0, 12))
  if (controlDigit !== parseInt(cleanCNP[12])) {
    errors.push('Cifra de control a CNP-ului este invalidă')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculate CNP control digit
 */
function calculateCNPControlDigit(cnpFirst12: string): number {
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]
  let sum = 0
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpFirst12[i]) * weights[i]
  }
  
  const remainder = sum % 11
  return remainder < 10 ? remainder : 1
}

/**
 * Validate phone number (Romanian format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = []
  
  if (!phone) {
    // Phone is optional in most cases
    return { isValid: true, errors }
  }
  
  // Clean phone number
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // Romanian phone patterns
  const patterns = [
    /^(\+4|004)?07\d{8}$/, // Mobile
    /^(\+4|004)?02\d{8}$/, // Bucharest landline
    /^(\+4|004)?03\d{8}$/, // Other landlines
  ]
  
  const isValid = patterns.some(pattern => pattern.test(cleanPhone))
  
  if (!isValid) {
    errors.push('Numărul de telefon nu este în format românesc valid')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { size: number; mimetype?: string; originalname?: string },
  options: {
    maxSize?: number
    allowedTypes?: string[]
    requiredExtensions?: string[]
  } = {}
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    requiredExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  } = options
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`Fișierul este prea mare. Dimensiunea maximă este ${Math.floor(maxSize / 1024 / 1024)}MB`)
  }
  
  if (file.size === 0) {
    errors.push('Fișierul este gol')
  }
  
  // Check MIME type
  if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
    errors.push(`Tipul de fișier ${file.mimetype} nu este permis`)
  }
  
  // Check file extension
  if (file.originalname) {
    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
    if (!requiredExtensions.includes(extension)) {
      errors.push(`Extensia de fișier ${extension} nu este permisă`)
    }
  }
  
  // Security warnings
  if (file.originalname) {
    if (file.originalname.includes('..')) {
      errors.push('Numele fișierului conține caractere periculoase')
    }
    
    if (file.originalname.length > 255) {
      errors.push('Numele fișierului este prea lung')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): ValidationResult {
  const errors: string[] = []
  
  if (!startDate) {
    errors.push('Data de început este obligatorie')
  }
  
  if (!endDate) {
    errors.push('Data de sfârșit este obligatorie')
  }
  
  if (startDate && endDate) {
    if (startDate > endDate) {
      errors.push('Data de început nu poate fi după data de sfârșit')
    }
    
    if (endDate > new Date()) {
      errors.push('Data de sfârșit nu poate fi în viitor')
    }
    
    // Check for reasonable date range
    const maxRange = 100 * 365 * 24 * 60 * 60 * 1000 // 100 years
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      errors.push('Intervalul de timp este prea mare (max 100 ani)')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate and sanitize text input for XSS prevention
 */
export function validateAndSanitizeText(
  text: string,
  options: {
    maxLength?: number
    minLength?: number
    allowHTML?: boolean
    required?: boolean
  } = {}
): ValidationResult & { sanitizedText?: string } {
  const errors: string[] = []
  const warnings: string[] = []
  
  const { maxLength = 1000, minLength = 0, allowHTML = false, required = false } = options
  
  if (!text && required) {
    errors.push('Textul este obligatoriu')
    return { isValid: false, errors }
  }
  
  if (!text) {
    return { isValid: true, errors, sanitizedText: '' }
  }
  
  if (text.length < minLength) {
    errors.push(`Textul trebuie să aibă minim ${minLength} caractere`)
  }
  
  if (text.length > maxLength) {
    errors.push(`Textul este prea lung (max ${maxLength} caractere)`)
  }
  
  let sanitizedText = text
  
  if (!allowHTML) {
    // Basic XSS prevention
    sanitizedText = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
    
    // Check for potential script injection
    if (/<script|javascript:|onload=|onerror=/i.test(text)) {
      warnings.push('Textul conține elemente ce par a fi cod malițios')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedText
  }
}

/**
 * Validate Romanian government institution name
 */
export function validateInstitutionName(name: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!name) {
    errors.push('Numele instituției este obligatoriu')
    return { isValid: false, errors }
  }
  
  if (name.length < 3) {
    errors.push('Numele instituției este prea scurt (minim 3 caractere)')
  }
  
  if (name.length > 200) {
    errors.push('Numele instituției este prea lung (max 200 caractere)')
  }
  
  // Check for valid Romanian institution patterns
  const validPrefixes = [
    'Ministerul',
    'Primăria',
    'Consiliul Județean',
    'Agenția',
    'Autoritatea',
    'Compania Națională',
    'Institutul Național',
    'Casa Națională',
    'Oficiul',
    'Direcția',
    'Inspectoratul'
  ]
  
  const hasValidPrefix = validPrefixes.some(prefix => 
    name.toLowerCase().startsWith(prefix.toLowerCase())
  )
  
  if (!hasValidPrefix) {
    warnings.push('Numele instituției nu pare să urmeze convenția pentru instituții publice românești')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate document classification level
 */
export function validateClassificationLevel(level: string): ValidationResult {
  const errors: string[] = []
  
  const validLevels = [
    'PUBLIC',
    'INTERN',
    'RESTRICTED',
    'CONFIDENTIAL',
    'SECRET'
  ]
  
  if (!level) {
    errors.push('Nivelul de clasificare este obligatoriu')
  } else if (!validLevels.includes(level.toUpperCase())) {
    errors.push(`Nivelul de clasificare "${level}" nu este valid. Nivele permise: ${validLevels.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate document retention period
 */
export function validateRetentionPeriod(period: string): ValidationResult {
  const errors: string[] = []
  
  const validPeriods = ['10y', '30y', 'permanent']
  
  if (!period) {
    errors.push('Perioada de retenție este obligatorie')
  } else if (!validPeriods.includes(period)) {
    errors.push(`Perioada de retenție "${period}" nu este validă. Perioade permise: ${validPeriods.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate complete document metadata
 */
export function validateDocumentMetadata(metadata: {
  title?: string
  description?: string
  documentType?: string
  creatorInfo?: any
  retentionCategory?: string
  classificationLevel?: string
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate title
  if (!metadata.title) {
    errors.push('Titlul documentului este obligatoriu')
  } else {
    const titleValidation = validateAndSanitizeText(metadata.title, { maxLength: 255, required: true })
    errors.push(...titleValidation.errors)
    warnings.push(...(titleValidation.warnings || []))
  }
  
  // Validate description
  if (metadata.description) {
    const descValidation = validateAndSanitizeText(metadata.description, { maxLength: 2000 })
    errors.push(...descValidation.errors)
    warnings.push(...(descValidation.warnings || []))
  }
  
  // Validate retention category
  if (metadata.retentionCategory) {
    const retentionValidation = validateRetentionPeriod(metadata.retentionCategory)
    errors.push(...retentionValidation.errors)
  }
  
  // Validate classification level
  if (metadata.classificationLevel) {
    const classificationValidation = validateClassificationLevel(metadata.classificationLevel)
    errors.push(...classificationValidation.errors)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
} 