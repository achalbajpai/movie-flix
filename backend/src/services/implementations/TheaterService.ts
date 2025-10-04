import { logger } from '@/config'
import { ITheaterRepository } from '@/repositories'
import {
  DatabaseTheater,
  TheaterWithDetails
} from '@/models/Database'
import { ITheaterService } from '../interfaces/ITheaterService'

export class TheaterService implements ITheaterService {
  constructor(private theaterRepository: ITheaterRepository) {}

  async getAllTheaters(): Promise<DatabaseTheater[]> {
    try {
      return await this.theaterRepository.findAll()
    } catch (error) {
      logger.error('Error getting all theaters', { error })
      throw error
    }
  }

  async getTheaterById(theaterId: number): Promise<TheaterWithDetails | null> {
    try {
      const theater = await this.theaterRepository.findById(theaterId)
      if (!theater) {
        logger.warn('Theater not found', { theaterId })
      }
      return theater
    } catch (error) {
      logger.error('Error getting theater by ID', { theaterId, error })
      throw error
    }
  }

  async getTheatersByCity(city: string): Promise<DatabaseTheater[]> {
    try {
      return await this.theaterRepository.findByCity(city)
    } catch (error) {
      logger.error('Error getting theaters by city', { city, error })
      throw error
    }
  }

  async getVerifiedTheaters(): Promise<DatabaseTheater[]> {
    try {
      return await this.theaterRepository.findVerified()
    } catch (error) {
      logger.error('Error getting verified theaters', { error })
      throw error
    }
  }

  async getTheatersByMovie(movieId: number, city?: string): Promise<DatabaseTheater[]> {
    try {
      return await this.theaterRepository.findByMovie(movieId, city)
    } catch (error) {
      logger.error('Error getting theaters by movie', { movieId, city, error })
      throw error
    }
  }

  async getCities(): Promise<string[]> {
    try {
      return await this.theaterRepository.getCities()
    } catch (error) {
      logger.error('Error getting cities', { error })
      throw error
    }
  }

  async searchTheaters(query: string): Promise<DatabaseTheater[]> {
    try {
      return await this.theaterRepository.search(query)
    } catch (error) {
      logger.error('Error searching theaters', { query, error })
      throw error
    }
  }
}

export const createTheaterService = (theaterRepository: ITheaterRepository): ITheaterService => {
  return new TheaterService(theaterRepository)
}
