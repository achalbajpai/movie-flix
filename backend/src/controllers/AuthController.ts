import { Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/auth'
import { logger } from '@/config/logger'
import { supabase } from '@/config/supabase'

export class AuthController {
  async syncUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, email, name, user_metadata } = req.body

      // Validate required fields
      if (!id || !email) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'User ID and email are required'
          }
        })
        return
      }

      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('User')
        .select('user_id')
        .eq('user_id', id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error checking existing user:', fetchError)
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to check existing user'
          }
        })
        return
      }

      // If user doesn't exist, create them
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('User')
          .insert({
            user_id: id,
            email: email,
            name: name || email.split('@')[0],
            role: 'user'
          })

        if (insertError) {
          logger.error('Error creating user:', insertError)
          res.status(500).json({
            success: false,
            error: {
              code: 'USER_CREATION_FAILED',
              message: 'Failed to create user in database'
            }
          })
          return
        }

        logger.info('New user created:', { id, email, name })
      } else {
        // User exists, optionally update their information
        const { error: updateError } = await supabase
          .from('User')
          .update({
            name: name || email.split('@')[0],
            email: email
          })
          .eq('user_id', id)

        if (updateError) {
          logger.error('Error updating user:', updateError)
          // Don't fail the request for update errors, just log them
        }

        logger.info('User information updated:', { id, email, name })
      }

      res.json({
        success: true,
        message: 'User synchronized successfully'
      })

    } catch (error) {
      logger.error('Auth sync error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during user sync'
        }
      })
    }
  }

  async getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        })
        return
      }

      const { data: user, error } = await supabase
        .from('User')
        .select('user_id, email, name, role')
        .eq('user_id', req.user.id)
        .single()

      if (error) {
        logger.error('Error fetching user profile:', error)
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user profile'
          }
        })
        return
      }

      res.json({
        success: true,
        data: user
      })

    } catch (error) {
      logger.error('Get user profile error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }
}

export const createAuthController = (): AuthController => {
  return new AuthController()
}