import {
  DatabaseTheater,
  TheaterWithDetails
} from '@/models/Database'

export interface ITheaterRepository {
  /**
   * Find all theaters
   */
  findAll(): Promise<DatabaseTheater[]>

  /**
   * Find theater by ID with screens
   */
  findById(theaterId: number): Promise<TheaterWithDetails | null>

  /**
   * Find theaters by city
   */
  findByCity(city: string): Promise<DatabaseTheater[]>

  /**
   * Find verified theaters only
   */
  findVerified(): Promise<DatabaseTheater[]>

  /**
   * Find theaters showing a specific movie
   */
  findByMovie(movieId: number, city?: string): Promise<DatabaseTheater[]>

  /**
   * Get all unique cities with theaters
   */
  getCities(): Promise<string[]>

  /**
   * Search theaters by name or location
   */
  search(query: string): Promise<DatabaseTheater[]>
}
