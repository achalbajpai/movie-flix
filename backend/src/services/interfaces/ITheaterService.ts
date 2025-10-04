import {
  DatabaseTheater,
  TheaterWithDetails
} from '@/models/Database'

export interface ITheaterService {
  /**
   * Get all theaters
   */
  getAllTheaters(): Promise<DatabaseTheater[]>

  /**
   * Get theater by ID with screens
   */
  getTheaterById(theaterId: number): Promise<TheaterWithDetails | null>

  /**
   * Get theaters in a specific city
   */
  getTheatersByCity(city: string): Promise<DatabaseTheater[]>

  /**
   * Get verified theaters only
   */
  getVerifiedTheaters(): Promise<DatabaseTheater[]>

  /**
   * Get theaters showing a specific movie
   */
  getTheatersByMovie(movieId: number, city?: string): Promise<DatabaseTheater[]>

  /**
   * Get list of cities with theaters
   */
  getCities(): Promise<string[]>

  /**
   * Search theaters by name or location
   */
  searchTheaters(query: string): Promise<DatabaseTheater[]>
}
