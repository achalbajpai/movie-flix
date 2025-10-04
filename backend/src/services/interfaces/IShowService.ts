import {
  DatabaseShow,
  ShowWithDetails,
  ShowSearchFilters,
  ShowSearchResult
} from '@/models/Database'

export interface IShowService {
  /**
   * Get show by ID with full details (movie, theater, screen, seats)
   */
  getShowById(showId: number): Promise<ShowWithDetails | null>

  /**
   * Search shows with filters
   */
  searchShows(filters: ShowSearchFilters): Promise<ShowSearchResult[]>

  /**
   * Get shows for a movie
   */
  getShowsByMovie(movieId: number, date?: string, city?: string): Promise<ShowWithDetails[]>

  /**
   * Get shows at a theater
   */
  getShowsByTheater(theaterId: number, date?: string): Promise<ShowWithDetails[]>

  /**
   * Get shows on a specific screen
   */
  getShowsByScreen(screenId: number, date?: string): Promise<ShowWithDetails[]>

  /**
   * Get shows by city and date
   */
  getShowsByCityAndDate(city: string, date: string): Promise<ShowWithDetails[]>

  /**
   * Get shows in date range
   */
  getShowsByDateRange(startDate: string, endDate: string): Promise<ShowWithDetails[]>

  /**
   * Check if show has enough available seats
   */
  hasAvailableSeats(showId: number, requiredSeats: number): Promise<boolean>

  /**
   * Get available seats count for a show
   */
  getAvailableSeatsCount(showId: number): Promise<number>

  /**
   * Validate show availability
   */
  validateShowAvailability(showId: number, seatCount: number): Promise<{
    available: boolean
    message?: string
  }>

  /**
   * Check if show is available (not in past, has seats)
   */
  isShowAvailable(showId: number): Promise<boolean>

  /**
   * Get upcoming shows (future shows only)
   */
  getUpcomingShows(filters?: Partial<ShowSearchFilters>): Promise<ShowWithDetails[]>
}
