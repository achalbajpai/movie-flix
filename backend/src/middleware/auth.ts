import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../config/logger'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    user_metadata?: any
  }
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Test environment bypass for testing
    if (process.env.NODE_ENV === 'test') {
      const testUserId = req.headers['user-id'] as string
      const authHeader = req.headers.authorization

      if (authHeader && authHeader.startsWith('Bearer ') && testUserId) {
        // Mock user for testing
        req.user = {
          id: testUserId,
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        }
        next()
        return
      }
    }

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'No authentication token provided',
          code: 'UNAUTHORIZED'
        }
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      logger.error('Authentication failed', { error: error?.message })
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired authentication token',
          code: 'UNAUTHORIZED'
        }
      })
      return
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata
    }

    next()
  } catch (error) {
    logger.error('Authentication middleware error', { error: (error as Error).message })
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during authentication',
        code: 'INTERNAL_ERROR'
      }
    })
  }
}

// Optional authentication middleware - doesn't fail if no token is provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next()
      return
    }

    const token = authHeader.substring(7)

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata
      }
    }

    next()
  } catch (error) {
    // Log error but don't block the request
    logger.error('Optional auth middleware error', { error: (error as Error).message })
    next()
  }
}