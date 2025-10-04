import { logger } from '@/config'
import { IShowRepository } from '@/repositories'
import {
  DatabaseShow,
  ShowWithDetails,
  ShowSearchFilters,
  ShowSearchResult
} from '@/models/Database'
import { IShowService } from '../interfaces/IShowService'

export class ShowService implements IShowService {
  constructor(private showRepository: IShowRepository) {}

  async getShowById(showId: number): Promise<ShowWithDetails | null> {
    try {
      const show = await this.showRepository.findById(showId)
      if (!show) {
        logger.warn('Show not found', { showId })
      }
      return show
    } catch (error) {
      logger.error('Error getting show by ID', { showId, error })
      throw error
    }
  }

  async searchShows(filters: ShowSearchFilters): Promise<ShowSearchResult[]> {
    try {
      logger.info('Searching shows', { filters })
      return await this.showRepository.search(filters)
    } catch (error) {
      logger.error('Error searching shows', { filters, error })
      throw error
    }
  }

  async getShowsByMovie(movieId: number, date?: string, city?: string): Promise<ShowWithDetails[]> {
    try {
      return await this.showRepository.findByMovie(movieId, date, city)
    } catch (error) {
      logger.error('Error getting shows by movie', { movieId, date, city, error })
      throw error
    }
  }

  async getShowsByTheater(theaterId: number, date?: string): Promise<ShowWithDetails[]> {
    try {
      return await this.showRepository.findByTheater(theaterId, date)
    } catch (error) {
      logger.error('Error getting shows by theater', { theaterId, date, error })
      throw error
    }
  }

  async getShowsByScreen(screenId: number, date?: string): Promise<ShowWithDetails[]> {
    try {
      return await this.showRepository.findByScreen(screenId, date)
    } catch (error) {
      logger.error('Error getting shows by screen', { screenId, date, error })
      throw error
    }
  }

  async getShowsByCityAndDate(city: string, date: string): Promise<ShowWithDetails[]> {
    try {
      return await this.showRepository.findByCityAndDate(city, date)
    } catch (error) {
      logger.error('Error getting shows by city and date', { city, date, error })
      throw error
    }
  }

  async getShowsByDateRange(startDate: string, endDate: string): Promise<ShowWithDetails[]> {
    try {
      return await this.showRepository.findByDateRange(startDate, endDate)
    } catch (error) {
      logger.error('Error getting shows by date range', { startDate, endDate, error })
      throw error
    }
  }

  async hasAvailableSeats(showId: number, requiredSeats: number): Promise<boolean> {
    try {
      return await this.showRepository.hasAvailableSeats(showId, requiredSeats)
    } catch (error) {
      logger.error('Error checking available seats', { showId, requiredSeats, error })
      throw error
    }
  }

  async getAvailableSeatsCount(showId: number): Promise<number> {
    try {
      return await this.showRepository.getAvailableSeatsCount(showId)
    } catch (error) {
      logger.error('Error getting available seats count', { showId, error })
      throw error
    }
  }

  async validateShowAvailability(
    showId: number,
    seatCount: number
  ): Promise<{ available: boolean; message?: string }> {
    try {
      // Check if show exists
      const show = await this.showRepository.findById(showId)
      if (!show) {
        return {
          available: false,
          message: 'Show not found'
        }
      }

      // Check if show is active
      if (!show.is_active) {
        return {
          available: false,
          message: 'Show is not active'
        }
      }

      // Check if show time has passed
      const showTime = new Date(show.show_time)
      if (showTime < new Date()) {
        return {
          available: false,
          message: 'Show time has passed'
        }
      }

      // Check if enough seats are available
      const availableSeatsCount = await this.getAvailableSeatsCount(showId)
      if (availableSeatsCount < seatCount) {
        return {
          available: false,
          message: `Only ${availableSeatsCount} seats available, but ${seatCount} requested`
        }
      }

      return {
        available: true
      }
    } catch (error) {
      logger.error('Error validating show availability', { showId, seatCount, error })
      throw error
    }
  }

  async isShowAvailable(showId: number): Promise<boolean> {
    try {
      const show = await this.showRepository.findById(showId)
      if (!show) return false

      // Check if show is active
      if (!show.is_active) return false

      // Check if show time hasn't passed
      const showTime = new Date(show.show_time)
      if (showTime < new Date()) return false

      // Check if seats are available
      const availableSeats = await this.getAvailableSeatsCount(showId)
      return availableSeats > 0
    } catch (error) {
      logger.error('Error checking if show is available', { showId, error })
      return false
    }
  }

  async getUpcomingShows(filters?: Partial<ShowSearchFilters>): Promise<ShowWithDetails[]> {
    try {
      // Get today's date as starting point
      const today = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // Next 30 days

      // Use findByDateRange to get ShowWithDetails
      const shows = await this.showRepository.findByDateRange(today, endDate.toISOString().split('T')[0])

      // Filter by additional criteria if provided
      let filteredShows = shows

      if (filters?.city) {
        filteredShows = filteredShows.filter(show =>
          show.theater?.city?.toLowerCase() === filters.city?.toLowerCase()
        )
      }

      if (filters?.movieId) {
        filteredShows = filteredShows.filter(show => show.movie_id === filters.movieId)
      }

      if (filters?.theaterId) {
        filteredShows = filteredShows.filter(show =>
          show.screen?.theater_id === filters.theaterId
        )
      }

      // Filter to only include shows that haven't started yet
      const now = new Date()
      return filteredShows.filter(show => new Date(show.show_time) > now)
    } catch (error) {
      logger.error('Error getting upcoming shows', { filters, error })
      throw error
    }
  }
}

export const createShowService = (showRepository: IShowRepository): IShowService => {
  return new ShowService(showRepository)
}
