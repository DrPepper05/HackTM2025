import { Request, Response, NextFunction } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { ValidationError } from './error.middleware'

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: any) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }))

    const error = new ValidationError('Request validation failed', {
      errors: validationErrors
    })

    next(error)
    return
  }

  next()
}

/**
 * Document validation rules
 */
export const validateDocumentUpload = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('document_type')
    .optional()
    .isIn(['contract', 'decision', 'report', 'correspondence', 'legal', 'financial', 'other'])
    .withMessage('Invalid document type'),
  body('retention_category')
    .optional()
    .isIn(['3y', '5y', '10y', '30y', 'permanent'])
    .withMessage('Invalid retention category'),
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Tags must be an array with maximum 20 items'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  handleValidationErrors
]

/**
 * Search validation rules
 */
export const validateSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Search query cannot exceed 500 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be a non-negative integer'),
  handleValidationErrors
]

/**
 * Access request validation rules
 */
export const validateAccessRequest = [
  body('requesterName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Requester name must be between 2 and 100 characters'),
  body('requesterEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('requesterPhone')
    .optional()
    .matches(/^(\+4|04|07)\d{8,9}$/)
    .withMessage('Invalid Romanian phone number format'),
  body('justification')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Justification must be between 10 and 1000 characters'),
  body('documentId')
    .optional()
    .isUUID()
    .withMessage('Invalid document ID format'),
  handleValidationErrors
]

/**
 * User authentication validation
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  handleValidationErrors
]

export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  handleValidationErrors
]

/**
 * UUID parameter validation
 */
export const validateUUID = (paramName: string = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
]

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
]

/**
 * Date range validation
 */
export const validateDateRange = [
  query('fromDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid from date format (use ISO 8601)'),
  query('toDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid to date format (use ISO 8601)'),
  handleValidationErrors
] 