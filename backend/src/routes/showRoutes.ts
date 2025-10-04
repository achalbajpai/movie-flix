import { Router } from 'express'
import { ShowController } from '@/controllers'
import { sanitizeRequest, authenticateUser } from '@/middleware'

export const createShowRoutes = (showController: ShowController): Router => {
  const router = Router()

  // Apply sanitization middleware to all routes
  router.use(sanitizeRequest)

  // Show search - require authentication as per user requirement
  router.get('/search', authenticateUser, showController.searchShows)

  // Upcoming shows
  router.get('/upcoming', showController.getUpcomingShows)

  // Shows by movie
  router.get('/movie/:movieId', showController.getShowsByMovie)

  // Shows by theater
  router.get('/theater/:theaterId', showController.getShowsByTheater)

  // Shows by screen
  router.get('/screen/:screenId', showController.getShowsByScreen)

  // Show availability
  router.get('/:id/availability', showController.checkShowAvailability)

  // Single show by ID (should come after specific routes)
  router.get('/:id', showController.getShowById)

  return router
}
