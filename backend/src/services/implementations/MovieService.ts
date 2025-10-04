import { logger } from '@/config'
import { IMovieRepository } from '@/repositories'
import {
  DatabaseMovie,
  MovieWithDetails,
  MovieSearchFilters,
  MovieSearchResult
} from '@/models/Database'
import { IMovieService } from '../interfaces/IMovieService'

export class MovieService implements IMovieService {
  constructor(private movieRepository: IMovieRepository) {}

  async getAllMovies(): Promise<DatabaseMovie[]> {
    try {
      return await this.movieRepository.findAll()
    } catch (error) {
      logger.error('Error getting all movies', { error })
      throw error
    }
  }

  async getMovieById(movieId: number): Promise<MovieWithDetails | null> {
    try {
      const movie = await this.movieRepository.findById(movieId)
      if (!movie) {
        logger.warn('Movie not found', { movieId })
      }
      return movie
    } catch (error) {
      logger.error('Error getting movie by ID', { movieId, error })
      throw error
    }
  }

  async searchMovies(filters: MovieSearchFilters): Promise<MovieSearchResult[]> {
    try {
      logger.info('Searching movies', { filters })
      return await this.movieRepository.search(filters)
    } catch (error) {
      logger.error('Error searching movies', { filters, error })
      throw error
    }
  }

  async getMoviesByGenre(genre: string): Promise<DatabaseMovie[]> {
    try {
      return await this.movieRepository.findByGenre(genre)
    } catch (error) {
      logger.error('Error getting movies by genre', { genre, error })
      throw error
    }
  }

  async getMoviesByLanguage(language: string): Promise<DatabaseMovie[]> {
    try {
      return await this.movieRepository.findByLanguage(language)
    } catch (error) {
      logger.error('Error getting movies by language', { language, error })
      throw error
    }
  }

  async getNowShowing(city?: string): Promise<DatabaseMovie[]> {
    try {
      return await this.movieRepository.findNowShowing(city)
    } catch (error) {
      logger.error('Error getting now showing movies', { city, error })
      throw error
    }
  }

  async getUpcomingMovies(limit: number = 10): Promise<DatabaseMovie[]> {
    try {
      return await this.movieRepository.findUpcoming(limit)
    } catch (error) {
      logger.error('Error getting upcoming movies', { limit, error })
      throw error
    }
  }

  async getMoviesByCity(city: string, date?: string): Promise<DatabaseMovie[]> {
    try {
      return await this.movieRepository.findByCity(city, date)
    } catch (error) {
      logger.error('Error getting movies by city', { city, date, error })
      throw error
    }
  }

  async getGenres(): Promise<string[]> {
    try {
      return await this.movieRepository.getGenres()
    } catch (error) {
      logger.error('Error getting genres', { error })
      throw error
    }
  }

  async getLanguages(): Promise<string[]> {
    try {
      return await this.movieRepository.getLanguages()
    } catch (error) {
      logger.error('Error getting languages', { error })
      throw error
    }
  }
}

export const createMovieService = (movieRepository: IMovieRepository): IMovieService => {
  return new MovieService(movieRepository)
}
