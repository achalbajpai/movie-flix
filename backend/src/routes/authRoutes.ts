import { Router } from 'express'
import { createAuthController } from '@/controllers/AuthController'
import { authenticateUser } from '@/middleware'

export const createAuthRoutes = (authController: ReturnType<typeof createAuthController>): Router => {
  const router = Router()

  // User synchronization - called when user signs in
  router.post('/sync-user', authenticateUser, authController.syncUser)

  // Get current user profile
  router.get('/profile', authenticateUser, authController.getUserProfile)

  return router
}