import { Router } from 'express'
import { createCityController } from '@/controllers'
import { sanitizeRequest } from '@/middleware'

export const createCityRoutes = (cityController: ReturnType<typeof createCityController>): Router => {
  const router = Router()

  // Apply sanitization middleware to all routes
  router.use(sanitizeRequest)

  // City search
  router.get('/search', cityController.searchCities)

  // Popular cities
  router.get('/popular', cityController.getPopularCities)

  // All cities
  router.get('/', cityController.getAllCities)

  // Single city by ID (should come after specific routes)
  router.get('/:id', cityController.getCityById)

  return router
}