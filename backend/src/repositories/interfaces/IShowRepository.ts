import {
  DatabaseShow,
  ShowWithDetails,
  ShowSearchFilters,
  ShowSearchResult
} from '@/models/Database'

export interface IShowRepository {
  /**
   * Find show by ID with full details
   */
  findById(showId: number): Promise<ShowWithDetails | null>

  /**
   * Search shows with filters
   */
  search(filters: ShowSearchFilters): Promise<ShowSearchResult[]>

  /**
   * Find shows by movie
   */
  findByMovie(movieId: number, date?: string, city?: string): Promise<ShowWithDetails[]>

  /**
   * Find shows by theater
   */
  findByTheater(theaterId: number, date?: string): Promise<ShowWithDetails[]>

  /**
   * Find shows by screen
   */
  findByScreen(screenId: number, date?: string): Promise<ShowWithDetails[]>

  /**
   * Find shows by date range
   */
  findByDateRange(startDate: string, endDate: string): Promise<ShowWithDetails[]>

  /**
   * Find shows by city and date
   */
  findByCityAndDate(city: string, date: string): Promise<ShowWithDetails[]>

  /**
   * Get available seats count for a show
   */
  getAvailableSeatsCount(showId: number): Promise<number>

  /**
   * Check if show has available seats
   */
  hasAvailableSeats(showId: number, requiredSeats: number): Promise<boolean>
}
