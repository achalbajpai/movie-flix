import { Router } from 'express'
import { BusController } from '@/controllers'
import { sanitizeRequest } from '@/middleware'

export const createBusRoutes = (busController: BusController): Router => {
  const router = Router()

  // Apply sanitization middleware to all routes
  router.use(sanitizeRequest)

  // Bus search
  router.get('/search', busController.searchBuses)

  // Bus statistics
  router.get('/stats', busController.getBusStatistics)

  // Buses by operator
  router.get('/operator/:operatorId', busController.getBusesByOperator)

  // Buses by route
  router.get('/route/:routeId', busController.getBusesByRoute)

  // Single bus by ID (should come after specific routes to avoid conflicts)
  router.get('/:id', busController.getBusById)

  return router
}