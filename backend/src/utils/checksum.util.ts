import crypto from 'crypto'
import fs from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

export type ChecksumAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512'

export interface ChecksumResult {
  algorithm: ChecksumAlgorithm
  hash: string
  size: number
}

export interface ChecksumOptions {
  algorithm?: ChecksumAlgorithm
  encoding?: 'hex' | 'base64'
}

/**
 * Calculate checksum for a buffer
 */
export function calculateChecksum(
  data: Buffer,
  options: ChecksumOptions = {}
): ChecksumResult {
  const algorithm = options.algorithm || 'sha256'
  const encoding = options.encoding || 'hex'

  const hash = crypto.createHash(algorithm)
  hash.update(data)

  return {
    algorithm,
    hash: hash.digest(encoding),
    size: data.length
  }
}

/**
 * Calculate checksum for a file
 */
export async function calculateFileChecksum(
  filePath: string,
  options: ChecksumOptions = {}
): Promise<ChecksumResult> {
  const data = await readFile(filePath)
  return calculateChecksum(data, options)
}

/**
 * Calculate checksum from a stream
 */
export function calculateStreamChecksum(
  stream: NodeJS.ReadableStream,
  options: ChecksumOptions = {}
): Promise<ChecksumResult> {
  return new Promise((resolve, reject) => {
    const algorithm = options.algorithm || 'sha256'
    const encoding = options.encoding || 'hex'
    
    const hash = crypto.createHash(algorithm)
    let size = 0

    stream.on('data', (chunk: Buffer) => {
      hash.update(chunk)
      size += chunk.length
    })

    stream.on('end', () => {
      resolve({
        algorithm,
        hash: hash.digest(encoding),
        size
      })
    })

    stream.on('error', reject)
  })
}

/**
 * Verify checksum matches expected value
 */
export function verifyChecksum(
  data: Buffer,
  expectedHash: string,
  algorithm: ChecksumAlgorithm = 'sha256'
): boolean {
  const result = calculateChecksum(data, { algorithm })
  return result.hash === expectedHash
}

/**
 * Calculate multiple checksums for the same data
 */
export function calculateMultipleChecksums(
  data: Buffer,
  algorithms: ChecksumAlgorithm[] = ['md5', 'sha1', 'sha256']
): Record<ChecksumAlgorithm, string> {
  const results: Record<string, string> = {}

  for (const algorithm of algorithms) {
    const result = calculateChecksum(data, { algorithm })
    results[algorithm] = result.hash
  }

  return results as Record<ChecksumAlgorithm, string>
}

/**
 * Generate a secure random hash (useful for tokens, IDs, etc.)
 */
export function generateSecureHash(
  length: number = 32,
  algorithm: ChecksumAlgorithm = 'sha256'
): string {
  const randomBytes = crypto.randomBytes(length)
  const hash = crypto.createHash(algorithm)
  hash.update(randomBytes)
  return hash.digest('hex')
}

/**
 * Calculate checksum with timestamp for audit purposes
 */
export function calculateAuditChecksum(
  data: Buffer,
  timestamp?: Date,
  metadata?: Record<string, any>
): {
  hash: string
  algorithm: ChecksumAlgorithm
  timestamp: string
  metadata?: Record<string, any>
} {
  const ts = timestamp || new Date()
  const algorithm: ChecksumAlgorithm = 'sha256'
  
  // Include timestamp and metadata in hash calculation for audit trail
  const hashInput = Buffer.concat([
    data,
    Buffer.from(ts.toISOString()),
    metadata ? Buffer.from(JSON.stringify(metadata)) : Buffer.alloc(0)
  ])

  const hash = crypto.createHash(algorithm)
  hash.update(hashInput)

  return {
    hash: hash.digest('hex'),
    algorithm,
    timestamp: ts.toISOString(),
    metadata
  }
}

/**
 * Validate Romanian government document checksums according to standards
 */
export function validateGovernmentChecksum(
  data: Buffer,
  providedChecksum: string,
  algorithm: ChecksumAlgorithm = 'sha256'
): {
  isValid: boolean
  calculatedChecksum: string
  providedChecksum: string
  algorithm: ChecksumAlgorithm
} {
  const calculated = calculateChecksum(data, { algorithm })
  
  return {
    isValid: calculated.hash.toLowerCase() === providedChecksum.toLowerCase(),
    calculatedChecksum: calculated.hash,
    providedChecksum,
    algorithm
  }
}

/**
 * Create a checksum chain for document integrity verification
 */
export function createChecksumChain(
  documents: Array<{ id: string; data: Buffer }>,
  previousHash?: string
): {
  chainHash: string
  documentHashes: Array<{ id: string; hash: string }>
  previousHash?: string
} {
  const documentHashes: Array<{ id: string; hash: string }> = []
  let chainData = previousHash ? Buffer.from(previousHash, 'hex') : Buffer.alloc(0)

  // Calculate hash for each document and add to chain
  for (const doc of documents) {
    const docHash = calculateChecksum(doc.data).hash
    documentHashes.push({ id: doc.id, hash: docHash })
    
    // Add document hash to chain
    chainData = Buffer.concat([chainData, Buffer.from(docHash, 'hex')])
  }

  // Calculate final chain hash
  const chainHash = calculateChecksum(chainData).hash

  return {
    chainHash,
    documentHashes,
    previousHash
  }
}

/**
 * Utility constants for common checksums
 */
export const CHECKSUM_ALGORITHMS: Record<string, ChecksumAlgorithm> = {
  MD5: 'md5',
  SHA1: 'sha1',
  SHA256: 'sha256',
  SHA512: 'sha512'
} as const

/**
 * Default algorithm for government documents
 */
export const DEFAULT_GOVERNMENT_ALGORITHM: ChecksumAlgorithm = 'sha256' 