import { Request, Response } from 'express'
import { ITheaterService } from '@/services/interfaces'
import { logger } from '@/config'

export class TheaterController {
  constructor(private theaterService: ITheaterService) {}

  /**
   * GET /api/theaters
   * Get all theaters
   */
  public getAllTheaters = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Get all theaters request')
      const theaters = await this.theaterService.getAllTheaters()

      res.json({
        success: true,
        data: theaters,
        count: theaters.length
      })
    } catch (error) {
      logger.error('Error getting theaters:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get theaters',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/theaters/:id
   * Get theater by ID with screens
   */
  public getTheaterById = async (req: Request, res: Response): Promise<void> => {
    try {
      const theaterId = Number(req.params.id)

      if (isNaN(theaterId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid theater ID'
        })
        return
      }

      logger.info('Get theater by ID', { theaterId })
      const theater = await this.theaterService.getTheaterById(theaterId)

      if (!theater) {
        res.status(404).json({
          success: false,
          message: 'Theater not found'
        })
        return
      }

      res.json({
        success: true,
        data: theater
      })
    } catch (error) {
      logger.error('Error getting theater:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get theater',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/theaters/city/:city
   * Get theaters in a specific city
   */
  public getTheatersByCity = async (req: Request, res: Response): Promise<void> => {
    try {
      const city = req.params.city

      logger.info('Get theaters by city', { city })
      const theaters = await this.theaterService.getTheatersByCity(city)

      res.json({
        success: true,
        data: theaters,
        count: theaters.length
      })
    } catch (error) {
      logger.error('Error getting theaters by city:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get theaters by city',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/theaters/movie/:movieId
   * Get theaters showing a specific movie
   */
  public getTheatersByMovie = async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = Number(req.params.movieId)
      const city = req.query.city as string | undefined

      if (isNaN(movieId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid movie ID'
        })
        return
      }

      logger.info('Get theaters by movie', { movieId, city })
      const theaters = await this.theaterService.getTheatersByMovie(movieId, city)

      res.json({
        success: true,
        data: theaters,
        count: theaters.length
      })
    } catch (error) {
      logger.error('Error getting theaters by movie:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get theaters by movie',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/theaters/verified
   * Get verified theaters only
   */
  public getVerifiedTheaters = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Get verified theaters')
      const theaters = await this.theaterService.getVerifiedTheaters()

      res.json({
        success: true,
        data: theaters,
        count: theaters.length
      })
    } catch (error) {
      logger.error('Error getting verified theaters:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get verified theaters',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/theaters/cities
   * Get list of cities with theaters
   */
  public getCities = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Get cities with theaters')
      const cities = await this.theaterService.getCities()

      res.json({
        success: true,
        data: cities,
        count: cities.length
      })
    } catch (error) {
      logger.error('Error getting cities:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get cities',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/theaters/search
   * Search theaters by name or location
   */
  public searchTheaters = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        })
        return
      }

      logger.info('Search theaters', { query })
      const theaters = await this.theaterService.searchTheaters(query)

      res.json({
        success: true,
        data: theaters,
        count: theaters.length
      })
    } catch (error) {
      logger.error('Error searching theaters:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search theaters',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
