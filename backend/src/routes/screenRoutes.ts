import { Router } from 'express'
import { ScreenController } from '@/controllers'
import { sanitizeRequest } from '@/middleware'

export const createScreenRoutes = (screenController: ScreenController): Router => {
  const router = Router()

  // Apply sanitization middleware to all routes
  router.use(sanitizeRequest)

  // Screens by theater
  router.get('/theater/:theaterId', screenController.getScreensByTheater)

  // Screens by type
  router.get('/type/:screenType', screenController.getScreensByType)

  // Screen capacity
  router.get('/:id/capacity', screenController.getScreenCapacity)

  // Single screen by ID
  router.get('/:id', screenController.getScreenById)

  return router
}
