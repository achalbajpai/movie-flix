import { Request, Response } from 'express'
import { IScreenService } from '@/services/interfaces'
import { logger } from '@/config'

export class ScreenController {
  constructor(private screenService: IScreenService) {}

  /**
   * GET /api/screens/:id
   * Get screen by ID with details
   */
  public getScreenById = async (req: Request, res: Response): Promise<void> => {
    try {
      const screenId = Number(req.params.id)

      if (isNaN(screenId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid screen ID'
        })
        return
      }

      logger.info('Get screen by ID', { screenId })
      const screen = await this.screenService.getScreenById(screenId)

      if (!screen) {
        res.status(404).json({
          success: false,
          message: 'Screen not found'
        })
        return
      }

      res.json({
        success: true,
        data: screen
      })
    } catch (error) {
      logger.error('Error getting screen:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get screen',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/screens/theater/:theaterId
   * Get all screens for a theater
   */
  public getScreensByTheater = async (req: Request, res: Response): Promise<void> => {
    try {
      const theaterId = Number(req.params.theaterId)

      if (isNaN(theaterId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid theater ID'
        })
        return
      }

      logger.info('Get screens by theater', { theaterId })
      const screens = await this.screenService.getScreensByTheater(theaterId)

      res.json({
        success: true,
        data: screens,
        count: screens.length
      })
    } catch (error) {
      logger.error('Error getting screens by theater:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get screens by theater',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/screens/type/:screenType
   * Get screens by type (IMAX, 3D, etc.)
   */
  public getScreensByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const screenType = req.params.screenType

      logger.info('Get screens by type', { screenType })
      const screens = await this.screenService.getScreensByType(screenType)

      res.json({
        success: true,
        data: screens,
        count: screens.length
      })
    } catch (error) {
      logger.error('Error getting screens by type:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get screens by type',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/screens/:id/capacity
   * Get screen capacity information
   */
  public getScreenCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
      const screenId = Number(req.params.id)

      if (isNaN(screenId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid screen ID'
        })
        return
      }

      logger.info('Get screen capacity', { screenId })
      const capacity = await this.screenService.getScreenCapacity(screenId)

      if (capacity === null) {
        res.status(404).json({
          success: false,
          message: 'Screen not found'
        })
        return
      }

      res.json({
        success: true,
        data: { screenId, capacity }
      })
    } catch (error) {
      logger.error('Error getting screen capacity:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get screen capacity',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
