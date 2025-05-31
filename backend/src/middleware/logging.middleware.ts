import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.config'

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  // Add request ID to headers
  req.headers['x-request-id'] = requestId
  res.setHeader('X-Request-ID', requestId)

  // Log request start
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - START (${requestId})`)

  // Capture response
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - startTime
    
    // Log request completion
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) (${requestId})`)

    // Log to database for important endpoints (async, don't block response)
    if (shouldLogToDatabase(req, res)) {
      logToDatabase(req, res, duration, requestId).catch(error => {
        console.error('Failed to log request to database:', error)
      })
    }

    return originalSend.call(this, data)
  }

  next()
}

/**
 * Determine if request should be logged to database
 */
function shouldLogToDatabase(req: Request, res: Response): boolean {
  // Log API errors
  if (res.statusCode >= 400) return true
  
  // Log important operations
  const importantPaths = [
    '/api/auth',
    '/api/documents',
    '/api/admin'
  ]
  
  return importantPaths.some(path => req.originalUrl.startsWith(path))
}

/**
 * Log request to database
 */
async function logToDatabase(
  req: Request,
  res: Response,
  duration: number,
  requestId: string
): Promise<void> {
  try {
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'API_REQUEST',
      p_entity_type: 'system',
      p_entity_id: requestId,
      p_details: {
        method: req.method,
        url: req.originalUrl,
        status_code: res.statusCode,
        duration_ms: duration,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        user_id: req.userId || null
      }
    })
  } catch (error) {
    // Don't throw, just log the error
    console.error('Database logging failed:', error)
  }
}

/**
 * Performance monitoring middleware
 */
export const performanceLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint()

  res.on('finish', () => {
    const endTime = process.hrtime.bigint()
    const duration = Number(endTime - startTime) / 1_000_000 // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) { // Requests taking more than 1 second
      console.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`)
    }
  })

  next()
} 