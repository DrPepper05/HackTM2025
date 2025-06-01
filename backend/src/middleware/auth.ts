/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';

/**
 * Extended Request interface with user property
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

/**
 * Middleware to verify JWT token and inject user into request
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    // Extract token from Bearer format
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Inject user into request
    req.user = {
      id: user.id,
      email: user.email || '',
      // Add other user properties as needed
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};