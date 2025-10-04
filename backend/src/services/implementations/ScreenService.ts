import { logger } from '@/config'
import { IScreenRepository } from '@/repositories'
import {
  DatabaseScreen,
  ScreenWithDetails
} from '@/models/Database'
import { IScreenService } from '../interfaces/IScreenService'

export class ScreenService implements IScreenService {
  constructor(private screenRepository: IScreenRepository) {}

  async getScreenById(screenId: number): Promise<ScreenWithDetails | null> {
    try {
      const screen = await this.screenRepository.findById(screenId)
      if (!screen) {
        logger.warn('Screen not found', { screenId })
      }
      return screen
    } catch (error) {
      logger.error('Error getting screen by ID', { screenId, error })
      throw error
    }
  }

  async getScreensByTheater(theaterId: number): Promise<DatabaseScreen[]> {
    try {
      return await this.screenRepository.findByTheater(theaterId)
    } catch (error) {
      logger.error('Error getting screens by theater', { theaterId, error })
      throw error
    }
  }

  async getScreensByType(screenType: string): Promise<DatabaseScreen[]> {
    try {
      return await this.screenRepository.findByType(screenType)
    } catch (error) {
      logger.error('Error getting screens by type', { screenType, error })
      throw error
    }
  }

  async getScreenCapacity(screenId: number): Promise<number> {
    try {
      return await this.screenRepository.getCapacity(screenId)
    } catch (error) {
      logger.error('Error getting screen capacity', { screenId, error })
      throw error
    }
  }

  async getScreenTypes(): Promise<string[]> {
    try {
      return await this.screenRepository.getScreenTypes()
    } catch (error) {
      logger.error('Error getting screen types', { error })
      throw error
    }
  }
}

export const createScreenService = (screenRepository: IScreenRepository): IScreenService => {
  return new ScreenService(screenRepository)
}
