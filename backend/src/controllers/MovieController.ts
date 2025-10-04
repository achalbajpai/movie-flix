import { Request, Response } from 'express'
import { IMovieService } from '@/services/interfaces'
import { MovieSearchParams } from '@/models/SearchModels'
import { logger } from '@/config'

export class MovieController {
  constructor(private movieService: IMovieService) {}

  /**
   * GET /api/movies
   * Search and list movies with optional filters
   */
  public searchMovies = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: MovieSearchParams = {
        city: req.query.city as string | undefined,
        date: req.query.date as string | undefined,
        movieId: req.query.movieId ? Number(req.query.movieId) : undefined,
        genre: req.query.genre as string | undefined,
        language: req.query.language as string | undefined
      }

      logger.info('Movie search request', { filters })
      const movies = await this.movieService.searchMovies(filters)

      res.json({
        success: true,
        data: movies,
        count: movies.length
      })
    } catch (error) {
      logger.error('Error searching movies:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search movies',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/movies/:id
   * Get movie details by ID
   */
  public getMovieById = async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = Number(req.params.id)

      if (isNaN(movieId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid movie ID'
        })
        return
      }

      logger.info('Get movie by ID', { movieId })
      const movie = await this.movieService.getMovieById(movieId)

      if (!movie) {
        res.status(404).json({
          success: false,
          message: 'Movie not found'
        })
        return
      }

      res.json({
        success: true,
        data: movie
      })
    } catch (error) {
      logger.error('Error getting movie:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get movie',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/movies/now-showing
   * Get movies currently showing
   */
  public getNowShowing = async (req: Request, res: Response): Promise<void> => {
    try {
      const city = req.query.city as string | undefined

      logger.info('Get now showing movies', { city })
      const movies = await this.movieService.getNowShowing(city)

      res.json({
        success: true,
        data: movies,
        count: movies.length
      })
    } catch (error) {
      logger.error('Error getting now showing movies:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get now showing movies',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/movies/upcoming
   * Get upcoming movies
   */
  public getUpcomingMovies = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined

      logger.info('Get upcoming movies', { limit })
      const movies = await this.movieService.getUpcomingMovies(limit)

      res.json({
        success: true,
        data: movies,
        count: movies.length
      })
    } catch (error) {
      logger.error('Error getting upcoming movies:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming movies',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/movies/genres
   * Get all movie genres
   */
  public getGenres = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Get movie genres')
      const genres = await this.movieService.getGenres()

      res.json({
        success: true,
        data: genres,
        count: genres.length
      })
    } catch (error) {
      logger.error('Error getting genres:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get genres',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/movies/languages
   * Get all movie languages
   */
  public getLanguages = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Get movie languages')
      const languages = await this.movieService.getLanguages()

      res.json({
        success: true,
        data: languages,
        count: languages.length
      })
    } catch (error) {
      logger.error('Error getting languages:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get languages',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
