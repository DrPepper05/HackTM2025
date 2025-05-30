// Middleware exports
export * from './auth.middleware'
export * from './error.middleware'
export * from './logging.middleware'
export * from './validation.middleware'

// Common middleware combinations
export { authenticateToken, requireStaff, requireAdmin } from './auth.middleware'
export { errorHandler, notFoundHandler, asyncHandler } from './error.middleware'
export { requestLogger, performanceLogger } from './logging.middleware'
export { handleValidationErrors, validateDocumentUpload, validateSearch } from './validation.middleware' 