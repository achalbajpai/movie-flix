import {
  DatabaseMovie,
  MovieWithDetails,
  MovieSearchFilters,
  MovieSearchResult
} from '@/models/Database'

export interface IMovieService {
  /**
   * Get all active movies
   */
  getAllMovies(): Promise<DatabaseMovie[]>

  /**
   * Get movie by ID with details
   */
  getMovieById(movieId: number): Promise<MovieWithDetails | null>

  /**
   * Search movies with filters and pagination
   */
  searchMovies(filters: MovieSearchFilters): Promise<MovieSearchResult[]>

  /**
   * Get movies by genre
   */
  getMoviesByGenre(genre: string): Promise<DatabaseMovie[]>

  /**
   * Get movies by language
   */
  getMoviesByLanguage(language: string): Promise<DatabaseMovie[]>

  /**
   * Get now showing movies (with active shows)
   */
  getNowShowing(city?: string): Promise<DatabaseMovie[]>

  /**
   * Get upcoming releases
   */
  getUpcomingMovies(limit?: number): Promise<DatabaseMovie[]>

  /**
   * Get movies showing in a city
   */
  getMoviesByCity(city: string, date?: string): Promise<DatabaseMovie[]>

  /**
   * Get all available genres
   */
  getGenres(): Promise<string[]>

  /**
   * Get all available languages
   */
  getLanguages(): Promise<string[]>
}
