import { Request, Response } from 'express'
import { IShowService } from '@/services/interfaces'
import { ShowSearchParams } from '@/models/SearchModels'
import { logger } from '@/config'

export class ShowController {
  constructor(private showService: IShowService) {}

  /**
   * GET /api/shows
   * Search shows with filters
   */
  public searchShows = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ShowSearchParams = {
        movieId: req.query.movieId ? Number(req.query.movieId) : undefined,
        theaterId: req.query.theaterId ? Number(req.query.theaterId) : undefined,
        city: req.query.city as string | undefined,
        date: req.query.date as string | undefined,
        screenType: req.query.screenType as string | undefined
      }

      logger.info('Show search request', { filters })
      const shows = await this.showService.searchShows(filters)

      res.json({
        success: true,
        data: shows,
        count: shows.length
      })
    } catch (error) {
      logger.error('Error searching shows:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search shows',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/shows/:id
   * Get show by ID with full details
   */
  public getShowById = async (req: Request, res: Response): Promise<void> => {
    try {
      const showId = Number(req.params.id)

      if (isNaN(showId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid show ID'
        })
        return
      }

      logger.info('Get show by ID', { showId })
      const show = await this.showService.getShowById(showId)

      if (!show) {
        res.status(404).json({
          success: false,
          message: 'Show not found'
        })
        return
      }

      res.json({
        success: true,
        data: show
      })
    } catch (error) {
      logger.error('Error getting show:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get show',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/shows/movie/:movieId
   * Get all shows for a movie
   */
  public getShowsByMovie = async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = Number(req.params.movieId)
      const city = req.query.city as string | undefined
      const date = req.query.date as string | undefined

      if (isNaN(movieId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid movie ID'
        })
        return
      }

      logger.info('Get shows by movie', { movieId, date, city })
      const shows = await this.showService.getShowsByMovie(movieId, date, city)

      res.json({
        success: true,
        data: shows,
        count: shows.length
      })
    } catch (error) {
      logger.error('Error getting shows by movie:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get shows by movie',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/shows/theater/:theaterId
   * Get all shows for a theater
   */
  public getShowsByTheater = async (req: Request, res: Response): Promise<void> => {
    try {
      const theaterId = Number(req.params.theaterId)
      const date = req.query.date as string | undefined

      if (isNaN(theaterId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid theater ID'
        })
        return
      }

      logger.info('Get shows by theater', { theaterId, date })
      const shows = await this.showService.getShowsByTheater(theaterId, date)

      res.json({
        success: true,
        data: shows,
        count: shows.length
      })
    } catch (error) {
      logger.error('Error getting shows by theater:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get shows by theater',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/shows/screen/:screenId
   * Get shows for a specific screen
   */
  public getShowsByScreen = async (req: Request, res: Response): Promise<void> => {
    try {
      const screenId = Number(req.params.screenId)
      const date = req.query.date as string | undefined

      if (isNaN(screenId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid screen ID'
        })
        return
      }

      logger.info('Get shows by screen', { screenId, date })
      const shows = await this.showService.getShowsByScreen(screenId, date)

      res.json({
        success: true,
        data: shows,
        count: shows.length
      })
    } catch (error) {
      logger.error('Error getting shows by screen:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get shows by screen',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/shows/:id/availability
   * Check show availability
   */
  public checkShowAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const showId = Number(req.params.id)

      if (isNaN(showId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid show ID'
        })
        return
      }

      logger.info('Check show availability', { showId })
      const isAvailable = await this.showService.isShowAvailable(showId)

      res.json({
        success: true,
        data: {
          showId,
          isAvailable
        }
      })
    } catch (error) {
      logger.error('Error checking show availability:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to check show availability',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/shows/upcoming
   * Get upcoming shows
   */
  public getUpcomingShows = async (req: Request, res: Response): Promise<void> => {
    try {
      const city = req.query.city as string | undefined
      const hours = req.query.hours ? Number(req.query.hours) : 24

      if (isNaN(hours) || hours <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid hours parameter'
        })
        return
      }

      logger.info('Get upcoming shows', { city })
      const filters = city ? { city } : undefined
      const shows = await this.showService.getUpcomingShows(filters)

      res.json({
        success: true,
        data: shows,
        count: shows.length
      })
    } catch (error) {
      logger.error('Error getting upcoming shows:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming shows',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
