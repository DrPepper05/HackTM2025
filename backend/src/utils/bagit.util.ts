// BagIt utilities for digital preservation packaging
// BagIt is a hierarchical file packaging format for storage and transfer of digital content

import crypto from 'crypto'
import { calculateChecksum, ChecksumAlgorithm } from './checksum.util'

export interface BagItFile {
  path: string
  data: Buffer
  checksum?: string
  checksumAlgorithm?: ChecksumAlgorithm
}

export interface BagItMetadata {
  'Bag-Software-Agent'?: string
  'Bagging-Date'?: string
  'Bag-Count'?: string
  'Bag-Group-Identifier'?: string
  'Bag-Size'?: string
  'Contact-Email'?: string
  'Contact-Name'?: string
  'Contact-Phone'?: string
  'External-Description'?: string
  'External-Identifier'?: string
  'Internal-Sender-Description'?: string
  'Internal-Sender-Identifier'?: string
  'Organization-Address'?: string
  'Payload-Oxum'?: string
  'Source-Organization'?: string
  [key: string]: string | undefined
}

export interface BagItOptions {
  checksumAlgorithms?: ChecksumAlgorithm[]
  metadata?: BagItMetadata
  fetchFiles?: Array<{
    url: string
    filename: string
    size?: number
    checksum?: string
  }>
  tagFiles?: Array<{
    filename: string
    content: string
  }>
}

export interface BagItPackage {
  files: Map<string, Buffer>
  metadata: BagItMetadata
  manifests: Map<ChecksumAlgorithm, string>
  tagManifests: Map<ChecksumAlgorithm, string>
  fetchFile?: string
  totalSize: number
  fileCount: number
}

/**
 * Create a BagIt package from files
 */
export function createBagItPackage(
  files: BagItFile[],
  options: BagItOptions = {}
): BagItPackage {
  const {
    checksumAlgorithms = ['sha256', 'md5'],
    metadata = {},
    fetchFiles = [],
    tagFiles = []
  } = options

  const bagFiles = new Map<string, Buffer>()
  const manifests = new Map<ChecksumAlgorithm, string>()
  const tagManifests = new Map<ChecksumAlgorithm, string>()

  // Default metadata
  const defaultMetadata: BagItMetadata = {
    'Bag-Software-Agent': 'OpenArchive BagIt Utility v1.0',
    'Bagging-Date': new Date().toISOString().split('T')[0],
    'Source-Organization': 'Guvernul României',
    'Contact-Name': 'OpenArchive System',
    ...metadata
  }

  // Create bagit.txt
  const bagitDeclaration = 'BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n'
  bagFiles.set('bagit.txt', Buffer.from(bagitDeclaration))

  // Create bag-info.txt
  const bagInfoContent = Object.entries(defaultMetadata)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') + '\n'
  bagFiles.set('bag-info.txt', Buffer.from(bagInfoContent))

  // Add payload files
  let totalPayloadSize = 0
  let fileCount = 0
  
  for (const file of files) {
    const dataPath = `data/${file.path}`
    bagFiles.set(dataPath, file.data)
    totalPayloadSize += file.data.length
    fileCount++
  }

  // Calculate payload oxum (octetstream sum)
  defaultMetadata['Payload-Oxum'] = `${totalPayloadSize}.${fileCount}`
  defaultMetadata['Bag-Size'] = formatFileSize(totalPayloadSize)

  // Update bag-info.txt with calculated values
  const updatedBagInfo = Object.entries(defaultMetadata)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') + '\n'
  bagFiles.set('bag-info.txt', Buffer.from(updatedBagInfo))

  // Generate manifests for each algorithm
  for (const algorithm of checksumAlgorithms) {
    const manifestLines: string[] = []
    
    for (const file of files) {
      const dataPath = `data/${file.path}`
      const checksum = calculateChecksum(file.data, { algorithm }).hash
      manifestLines.push(`${checksum}  ${dataPath}`)
    }
    
    const manifestContent = manifestLines.join('\n') + '\n'
    const manifestFilename = `manifest-${algorithm}.txt`
    bagFiles.set(manifestFilename, Buffer.from(manifestContent))
    manifests.set(algorithm, manifestContent)
  }

  // Add fetch.txt if there are fetch files
  if (fetchFiles.length > 0) {
    const fetchContent = fetchFiles
      .map(f => `${f.url}  ${f.size || '-'}  data/${f.filename}`)
      .join('\n') + '\n'
    bagFiles.set('fetch.txt', Buffer.from(fetchContent))
  }

  // Add custom tag files
  for (const tagFile of tagFiles) {
    bagFiles.set(tagFile.filename, Buffer.from(tagFile.content))
  }

  // Generate tag manifests
  for (const algorithm of checksumAlgorithms) {
    const tagManifestLines: string[] = []
    
    // Include non-manifest, non-tag-manifest files
    for (const [filename, content] of bagFiles.entries()) {
      if (!filename.startsWith('manifest-') && !filename.startsWith('tagmanifest-')) {
        const checksum = calculateChecksum(content, { algorithm }).hash
        tagManifestLines.push(`${checksum}  ${filename}`)
      }
    }
    
    const tagManifestContent = tagManifestLines.join('\n') + '\n'
    const tagManifestFilename = `tagmanifest-${algorithm}.txt`
    bagFiles.set(tagManifestFilename, Buffer.from(tagManifestContent))
    tagManifests.set(algorithm, tagManifestContent)
  }

  return {
    files: bagFiles,
    metadata: defaultMetadata,
    manifests,
    tagManifests,
    fetchFile: fetchFiles.length > 0 ? fetchFiles.map(f => `${f.url}  ${f.size || '-'}  data/${f.filename}`).join('\n') + '\n' : undefined,
    totalSize: Array.from(bagFiles.values()).reduce((sum, buf) => sum + buf.length, 0),
    fileCount: files.length
  }
}

/**
 * Validate a BagIt package
 */
export function validateBagItPackage(
  bagFiles: Map<string, Buffer>,
  options: { strict?: boolean } = {}
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  statistics: {
    payloadFiles: number
    payloadSize: number
    tagFiles: number
    totalFiles: number
  }
} {
  const errors: string[] = []
  const warnings: string[] = []
  const { strict = false } = options

  // Check for required files
  if (!bagFiles.has('bagit.txt')) {
    errors.push('Missing required bagit.txt file')
  }

  if (!bagFiles.has('bag-info.txt')) {
    if (strict) {
      errors.push('Missing bag-info.txt file')
    } else {
      warnings.push('Missing bag-info.txt file (recommended)')
    }
  }

  // Check bagit.txt format
  const bagitContent = bagFiles.get('bagit.txt')?.toString()
  if (bagitContent) {
    if (!bagitContent.includes('BagIt-Version:')) {
      errors.push('bagit.txt missing BagIt-Version declaration')
    }
    if (!bagitContent.includes('Tag-File-Character-Encoding:')) {
      errors.push('bagit.txt missing Tag-File-Character-Encoding declaration')
    }
  }

  // Find manifest files
  const manifestFiles = Array.from(bagFiles.keys()).filter(f => f.startsWith('manifest-'))
  if (manifestFiles.length === 0) {
    errors.push('No manifest files found')
  }

  // Validate each manifest
  for (const manifestFile of manifestFiles) {
    const algorithm = manifestFile.replace('manifest-', '').replace('.txt', '') as ChecksumAlgorithm
    const manifestContent = bagFiles.get(manifestFile)?.toString()
    
    if (!manifestContent) continue

    const manifestEntries = manifestContent.trim().split('\n')
    for (const entry of manifestEntries) {
      const [checksum, ...pathParts] = entry.split(/\s+/)
      const filePath = pathParts.join(' ')
      
      if (!bagFiles.has(filePath)) {
        errors.push(`Manifest references missing file: ${filePath}`)
        continue
      }

      const fileContent = bagFiles.get(filePath)!
      const calculatedChecksum = calculateChecksum(fileContent, { algorithm }).hash
      
      if (calculatedChecksum !== checksum) {
        errors.push(`Checksum mismatch for ${filePath}: expected ${checksum}, got ${calculatedChecksum}`)
      }
    }
  }

  // Validate tag manifests
  const tagManifestFiles = Array.from(bagFiles.keys()).filter(f => f.startsWith('tagmanifest-'))
  for (const tagManifestFile of tagManifestFiles) {
    const algorithm = tagManifestFile.replace('tagmanifest-', '').replace('.txt', '') as ChecksumAlgorithm
    const tagManifestContent = bagFiles.get(tagManifestFile)?.toString()
    
    if (!tagManifestContent) continue

    const tagManifestEntries = tagManifestContent.trim().split('\n')
    for (const entry of tagManifestEntries) {
      const [checksum, ...pathParts] = entry.split(/\s+/)
      const filePath = pathParts.join(' ')
      
      if (!bagFiles.has(filePath)) {
        errors.push(`Tag manifest references missing file: ${filePath}`)
        continue
      }

      const fileContent = bagFiles.get(filePath)!
      const calculatedChecksum = calculateChecksum(fileContent, { algorithm }).hash
      
      if (calculatedChecksum !== checksum) {
        errors.push(`Tag file checksum mismatch for ${filePath}`)
      }
    }
  }

  // Calculate statistics
  const payloadFiles = Array.from(bagFiles.keys()).filter(f => f.startsWith('data/')).length
  const payloadSize = Array.from(bagFiles.entries())
    .filter(([path]) => path.startsWith('data/'))
    .reduce((sum, [_, content]) => sum + content.length, 0)
  const tagFiles = Array.from(bagFiles.keys()).filter(f => !f.startsWith('data/')).length
  const totalFiles = bagFiles.size

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      payloadFiles,
      payloadSize,
      tagFiles,
      totalFiles
    }
  }
}

/**
 * Extract files from a BagIt package
 */
export function extractBagItPackage(bagFiles: Map<string, Buffer>): {
  payloadFiles: Map<string, Buffer>
  metadata: BagItMetadata
  manifests: Map<ChecksumAlgorithm, string>
} {
  const payloadFiles = new Map<string, Buffer>()
  const manifests = new Map<ChecksumAlgorithm, string>()
  let metadata: BagItMetadata = {}

  // Extract payload files
  for (const [path, content] of bagFiles.entries()) {
    if (path.startsWith('data/')) {
      const relativePath = path.substring(5) // Remove 'data/' prefix
      payloadFiles.set(relativePath, content)
    }
  }

  // Extract metadata from bag-info.txt
  const bagInfoContent = bagFiles.get('bag-info.txt')?.toString()
  if (bagInfoContent) {
    metadata = parseBagInfo(bagInfoContent)
  }

  // Extract manifests
  for (const [filename, content] of bagFiles.entries()) {
    if (filename.startsWith('manifest-') && filename.endsWith('.txt')) {
      const algorithm = filename.replace('manifest-', '').replace('.txt', '') as ChecksumAlgorithm
      manifests.set(algorithm, content.toString())
    }
  }

  return {
    payloadFiles,
    metadata,
    manifests
  }
}

/**
 * Create BagIt package for Romanian government documents
 */
export function createGovernmentDocumentBag(
  documentId: string,
  documentFiles: Array<{ filename: string; content: Buffer; metadata?: any }>,
  documentMetadata: {
    title: string
    creator?: string
    date?: string
    description?: string
    institution?: string
    classification?: string
  }
): BagItPackage {
  const files: BagItFile[] = documentFiles.map(file => ({
    path: file.filename,
    data: file.content
  }))

  const metadata: BagItMetadata = {
    'External-Identifier': documentId,
    'External-Description': documentMetadata.title,
    'Source-Organization': documentMetadata.institution || 'Guvernul României',
    'Contact-Name': 'OpenArchive System',
    'Contact-Email': 'arhiva@gov.ro',
    'Internal-Sender-Description': documentMetadata.description,
    'Bagging-Date': new Date().toISOString().split('T')[0],
    'Bag-Software-Agent': 'OpenArchive Government Document Packager v1.0'
  }

  // Add custom Romanian government metadata
  const customTagFiles = [
    {
      filename: 'metadata/document-info.txt',
      content: [
        `Document ID: ${documentId}`,
        `Title: ${documentMetadata.title}`,
        `Creator: ${documentMetadata.creator || 'Unknown'}`,
        `Date: ${documentMetadata.date || 'Unknown'}`,
        `Institution: ${documentMetadata.institution || 'Guvernul României'}`,
        `Classification: ${documentMetadata.classification || 'Public'}`,
        `Package Date: ${new Date().toISOString()}`,
        `Package System: OpenArchive v1.0`
      ].join('\n')
    },
    {
      filename: 'metadata/preservation-info.txt',
      content: [
        'Digital Preservation Information',
        '================================',
        'This package follows BagIt specification v1.0',
        'Created for long-term digital preservation',
        'Compliant with Romanian National Archives standards',
        `Files packaged: ${documentFiles.length}`,
        `Total size: ${formatFileSize(documentFiles.reduce((sum, f) => sum + f.content.length, 0))}`,
        'Checksum algorithms: SHA-256, MD5',
        'Character encoding: UTF-8'
      ].join('\n')
    }
  ]

  return createBagItPackage(files, {
    metadata,
    tagFiles: customTagFiles,
    checksumAlgorithms: ['sha256', 'md5']
  })
}

/**
 * Parse bag-info.txt content
 */
function parseBagInfo(content: string): BagItMetadata {
  const metadata: BagItMetadata = {}
  
  const lines = content.trim().split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      metadata[key] = value
    }
  }
  
  return metadata
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate BagIt package filename
 */
export function generateBagFilename(
  documentId: string,
  timestamp?: Date
): string {
  const ts = timestamp || new Date()
  const dateStr = ts.toISOString().split('T')[0].replace(/-/g, '')
  const timeStr = ts.toISOString().split('T')[1].split('.')[0].replace(/:/g, '')
  
  return `gov-ro-${documentId}-${dateStr}-${timeStr}.bag`
}

/**
 * BagIt constants and utilities
 */
export const BAGIT_VERSION = '1.0'
export const BAGIT_ENCODING = 'UTF-8'

export const REQUIRED_BAGIT_FILES = ['bagit.txt'] as const
export const RECOMMENDED_BAGIT_FILES = ['bag-info.txt'] as const 