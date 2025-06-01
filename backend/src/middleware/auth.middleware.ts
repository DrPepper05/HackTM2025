import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.config'
import { UserProfile } from '../types/database.types'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile & { id: string }
      userId?: string
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: UserProfile & { id: string }
  userId: string
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required'
      })
      return
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
      return
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User profile not found'
      })
      return
    }

    // Add user to request
    req.user = { ...profile, id: user.id }
    req.userId = user.id

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    })
  }
}

/**
 * Middleware to authenticate optional tokens (for public/private content)
 */
export const authenticateOptionalToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      // No token provided, continue as anonymous
      next()
      return
    }

    // Try to verify token but don't fail if invalid
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (!error && user) {
        // Get user profile
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          req.user = { ...profile, id: user.id }
          req.userId = user.id
        }
      }
    } catch (error) {
      // Ignore token errors for optional auth
      console.log('Optional auth failed, continuing as anonymous')
    }

    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    next() // Continue anyway for optional auth
  }
}

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin role required'
    })
    return
  }

  next()
}

/**
 * Middleware to check if user has specific roles
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `One of the following roles required: ${allowedRoles.join(', ')}`
      })
      return
    }

    next()
  }
}

/**
 * Middleware to check if user is staff (not citizen)
 */
export const requireStaff = requireRoles(['clerk', 'archivist', 'inspector', 'admin'])

/**
 * Middleware to check if user can manage documents
 */
export const requireDocumentManager = requireRoles(['archivist', 'admin'])

/**
 * Middleware to check if user can process access requests
 */
export const requireAccessProcessor = requireRoles(['archivist', 'admin'])

/**
 * Middleware to extract user ID from token without full validation (for logging)
 */
export const extractUserIdForLogging = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        if (user) {
          req.userId = user.id
        }
      } catch (error) {
        // Ignore errors for logging middleware
      }
    }

    next()
  } catch (error) {
    next() // Continue anyway
  }
} 