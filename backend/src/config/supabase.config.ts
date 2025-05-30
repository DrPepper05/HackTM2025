import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

// Environment variables validation
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const

// Validate environment variables on startup
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ============================================
// CLIENT INSTANCES
// ============================================

/**
 * Public Supabase client for authenticated requests
 * Uses the anon key and respects RLS policies
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'openarchive-backend'
      }
    }
  }
)

/**
 * Admin Supabase client for server-side operations
 * Uses service role key and bypasses RLS
 * CAUTION: Only use for admin operations and system tasks
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-application-name': 'openarchive-backend-admin'
      }
    }
  }
)

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a Supabase client for a specific user session
 * Useful for API routes that need to act on behalf of a user
 */
export function createUserClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-application-name': 'openarchive-backend-user'
        }
      }
    }
  )
}

/**
 * S3 bucket names as constants (for future use)
 * These will be used when S3 is implemented
 */
export const S3_BUCKETS = {
  DOCUMENTS: 'openarchive-documents',
  PUBLIC_DOCUMENTS: 'openarchive-public',
  TEMP_UPLOADS: 'openarchive-temp',
  ARCHIVE_TRANSFERS: 'openarchive-transfers'
} as const

/**
 * Common Supabase error codes
 */
export const SUPABASE_ERRORS = {
  INVALID_JWT: 'invalid_jwt',
  NO_ROWS: 'PGRST116',
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  INSUFFICIENT_PRIVILEGE: '42501'
} as const

/**
 * Helper to check if an error is a specific Supabase error
 */
export function isSupabaseError(error: any, code: string): boolean {
  return error?.code === code || error?.details?.includes(code)
}

/**
 * Extract user ID from a Supabase client
 */
export async function getUserId(client: SupabaseClient<Database>): Promise<string | null> {
  const { data: { user } } = await client.auth.getUser()
  return user?.id || null
}

/**
 * Get user's role from profile
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error || !data) return null
  return data.role
}

/**
 * Verify user has one of the required roles
 */
export async function verifyUserRole(
  userId: string, 
  requiredRoles: string[]
): Promise<boolean> {
  const role = await getUserRole(userId)
  return role ? requiredRoles.includes(role) : false
}

// ============================================
// S3 PATH HELPERS (For future S3 implementation)
// ============================================

/**
 * Generate a unique S3 key for a document file
 * Following pattern: year/month/documentId/fileType_timestamp_filename
 */
export function generateS3Key(
  fileName: string,
  documentId: string,
  fileType: 'original' | 'redacted' | 'ocr_text' | 'transfer' = 'original'
): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now()
  
  // Clean filename - remove special characters but keep extension
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  return `${year}/${month}/${documentId}/${fileType}_${timestamp}_${cleanName}`
}

/**
 * Parse S3 key to extract metadata
 */
export function parseS3Key(s3Key: string): {
  year: string
  month: string
  documentId: string
  fileType: string
  timestamp: string
  fileName: string
} | null {
  const pattern = /^(\d{4})\/(\d{2})\/([^/]+)\/(original|redacted|ocr_text|transfer)_(\d+)_(.+)$/
  const match = s3Key.match(pattern)
  
  if (!match) return null
  
  return {
    year: match[1],
    month: match[2],
    documentId: match[3],
    fileType: match[4],
    timestamp: match[5],
    fileName: match[6]
  }
}

// ============================================
// DATABASE TRANSACTION HELPER
// ============================================

/**
 * Execute multiple operations in a transaction-like manner
 * Note: Supabase doesn't support true transactions via the client library
 * This provides a best-effort approach with rollback logic
 */
export async function executeTransaction<T>(
  operations: Array<() => Promise<any>>,
  rollbacks: Array<() => Promise<any>> = []
): Promise<{ success: boolean; data?: T; error?: any }> {
  const executedOperations: number[] = []
  
  try {
    const results: any[] = []
    
    for (let i = 0; i < operations.length; i++) {
      const result = await operations[i]()
      results.push(result)
      executedOperations.push(i)
    }
    
    return { success: true, data: results as T }
  } catch (error) {
    // Attempt rollbacks in reverse order
    for (let i = executedOperations.length - 1; i >= 0; i--) {
      const rollbackIndex = executedOperations[i]
      if (rollbacks[rollbackIndex]) {
        try {
          await rollbacks[rollbackIndex]()
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError)
        }
      }
    }
    
    return { success: false, error }
  }
}

// ============================================
// RATE LIMITING HELPER
// ============================================

/**
 * Simple in-memory rate limiter for API protection
 * In production, use Redis or a proper rate limiting service
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxAttempts: number = 60   // 60 requests per minute
  ) {}
  
  check(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (validAttempts.length >= this.maxAttempts) {
      return false // Rate limit exceeded
    }
    
    validAttempts.push(now)
    this.attempts.set(identifier, validAttempts)
    
    return true // Within limits
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

export const rateLimiter = new RateLimiter()

// ============================================
// MONITORING HELPERS
// ============================================

/**
 * Log database operations for monitoring
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: any
): void {
  const log = {
    timestamp: new Date().toISOString(),
    operation,
    table,
    duration_ms: duration,
    success,
    error: error ? error.message : undefined
  }
  
  if (process.env.NODE_ENV === 'production') {
    // In production, send to monitoring service
    // For now, just console log
    console.log(JSON.stringify(log))
  } else {
    console.log('DB Operation:', log)
  }
}

/**
 * Wrap a database operation with timing and logging
 */
export async function withMonitoring<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  let success = false
  let error: any
  
  try {
    const result = await fn()
    success = true
    return result
  } catch (err) {
    error = err
    throw err
  } finally {
    const duration = Date.now() - start
    logDatabaseOperation(operation, table, duration, success, error)
  }
}

// ============================================
// PLACEHOLDER INTERFACES FOR S3 (Future Implementation)
// ============================================

/**
 * Interface for S3 operations - to be implemented later
 */
export interface IS3Service {
  uploadFile(bucket: string, key: string, file: Buffer, metadata?: Record<string, string>): Promise<{ success: boolean; error?: any }>
  downloadFile(bucket: string, key: string): Promise<{ data: Buffer | null; error?: any }>
  deleteFile(bucket: string, key: string): Promise<{ success: boolean; error?: any }>
  generatePresignedUrl(bucket: string, key: string, expiresIn?: number): Promise<{ url: string | null; error?: any }>
  listFiles(bucket: string, prefix: string): Promise<{ files: string[]; error?: any }>
}

/**
 * Placeholder S3 service - returns mock responses for now
 */
export const s3Service: IS3Service = {
  async uploadFile() {
    console.warn('S3 not implemented yet - using mock')
    return { success: true }
  },
  async downloadFile() {
    console.warn('S3 not implemented yet - using mock')
    return { data: Buffer.from('mock file content') }
  },
  async deleteFile() {
    console.warn('S3 not implemented yet - using mock')
    return { success: true }
  },
  async generatePresignedUrl() {
    console.warn('S3 not implemented yet - using mock')
    return { url: 'https://mock-s3-url.com/file' }
  },
  async listFiles() {
    console.warn('S3 not implemented yet - using mock')
    return { files: [] }
  }
}