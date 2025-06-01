import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.config'

export interface APIError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

/**
 * Custom error class for API errors
 */
export class AppError extends Error implements APIError {
  public statusCode: number
  public code: string
  public details?: any
  public isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Create specific error types
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden action') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string
  message: string
  code: string
  details?: any
  timestamp: string
  path: string
  requestId?: string
}

/**
 * Main error handling middleware
 */
export const errorHandler = async (
  error: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Generate request ID for tracking
    const requestId = req.headers['x-request-id'] as string || 
                     Math.random().toString(36).substring(2, 15)

    // Determine error details
    const statusCode = error.statusCode || 500
    const code = error.code || 'INTERNAL_ERROR'
    const message = error.message || 'An unexpected error occurred'
    
    // Log error details
    const errorLog = {
      requestId,
      error: error.name,
      message,
      code,
      statusCode,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.userId,
      timestamp: new Date().toISOString()
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', errorLog)
    }

    // Log serious errors to database
    if (statusCode >= 500) {
      try {
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'API_ERROR',
          p_entity_type: 'system',
          p_entity_id: null,
          p_details: {
            ...errorLog,
            user_id: req.userId || null
          }
        })
      } catch (dbError: any) {
        console.error('Failed to log error to database:', dbError)
      }
    }

    // Prepare error response
    const errorResponse: ErrorResponse = {
      error: statusCode >= 500 ? 'Internal Server Error' : error.name,
      message: statusCode >= 500 ? 'An internal error occurred' : message,
      code,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId
    }

    // Include details for client errors (400-499) but not server errors
    if (statusCode < 500 && error.details) {
      errorResponse.details = error.details
    }

    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    })

    res.status(statusCode).json(errorResponse)
  } catch (handlerError) {
    // Fallback error response if error handler itself fails
    console.error('Error handler failed:', handlerError)
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'A critical error occurred',
      code: 'HANDLER_ERROR',
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    })
  }
}

/**
 * Middleware to handle 404 not found errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

/**
 * Async error wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Validation error handler for request data
 */
export const handleValidationError = (
  validationErrors: any[],
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationErrors.map(err => ({
    field: err.param || err.path,
    message: err.msg || err.message,
    value: err.value
  }))

  const error = new ValidationError('Request validation failed', {
    errors
  })

  next(error)
}

/**
 * Rate limiting error handler
 */
export const handleRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new RateLimitError(
    'Too many requests, please try again later'
  )
  next(error)
}

/**
 * Database error handler
 */
export const handleDatabaseError = (error: any): AppError => {
  // Handle common database errors
  if (error.code === '23505') { // Unique violation
    return new ConflictError('Resource already exists', {
      constraint: error.constraint,
      detail: error.detail
    })
  }

  if (error.code === '23503') { // Foreign key violation
    return new ValidationError('Referenced resource not found', {
      constraint: error.constraint,
      detail: error.detail
    })
  }

  if (error.code === '42P01') { // Table does not exist
    return new AppError('Database schema error', 500, 'SCHEMA_ERROR')
  }

  // Generic database error
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR', {
    originalError: error.message
  })
}

/**
 * Supabase error handler
 */
export const handleSupabaseError = (error: any): AppError => {
  // Handle Supabase-specific errors
  switch (error.code) {
    case 'PGRST116': // No rows found
      return new NotFoundError('Resource')
    
    case 'PGRST301': // Permission denied
      return new ForbiddenError('Insufficient permissions')
    
    case '42501': // Insufficient privilege
      return new ForbiddenError('Access denied')
    
    case '23514': // Check violation
      return new ValidationError('Data validation failed', {
        detail: error.detail
      })
    
    default:
      if (error.message?.includes('JWT')) {
        return new UnauthorizedError('Invalid or expired token')
      }
      
      return new AppError(
        error.message || 'Database operation failed',
        500,
        'SUPABASE_ERROR'
      )
  }
}

/**
 * Express error type guard
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

/**
 * Process uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error)
  // Exit gracefully
  process.exit(1)
})

/**
 * Process unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit for unhandled rejections, just log them
}) 