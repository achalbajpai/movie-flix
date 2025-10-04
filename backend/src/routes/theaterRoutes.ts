import { Router } from 'express'
import { TheaterController } from '@/controllers'
import { sanitizeRequest } from '@/middleware'

export const createTheaterRoutes = (theaterController: TheaterController): Router => {
  const router = Router()

  // Apply sanitization middleware to all routes
  router.use(sanitizeRequest)

  // Get all theaters
  router.get('/', theaterController.getAllTheaters)

  // Theater search
  router.get('/search', theaterController.searchTheaters)

  // Verified theaters
  router.get('/verified', theaterController.getVerifiedTheaters)

  // Cities with theaters
  router.get('/cities', theaterController.getCities)

  // Theaters by city
  router.get('/city/:city', theaterController.getTheatersByCity)

  // Theaters showing a movie
  router.get('/movie/:movieId', theaterController.getTheatersByMovie)

  // Single theater by ID (should come after specific routes)
  router.get('/:id', theaterController.getTheaterById)

  return router
}
