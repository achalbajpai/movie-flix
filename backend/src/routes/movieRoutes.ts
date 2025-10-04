import { Router } from 'express'
import { MovieController } from '@/controllers'
import { sanitizeRequest, authenticateUser } from '@/middleware'

export const createMovieRoutes = (movieController: MovieController): Router => {
  const router = Router()

  // Apply sanitization middleware to all routes
  router.use(sanitizeRequest)

  // Movie search and list
  router.get('/', movieController.searchMovies)

  // Now showing movies
  router.get('/now-showing', movieController.getNowShowing)

  // Upcoming movies
  router.get('/upcoming', movieController.getUpcomingMovies)

  // Movie genres
  router.get('/genres', movieController.getGenres)

  // Movie languages
  router.get('/languages', movieController.getLanguages)

  // Single movie by ID (should come after specific routes to avoid conflicts)
  router.get('/:id', movieController.getMovieById)

  return router
}
