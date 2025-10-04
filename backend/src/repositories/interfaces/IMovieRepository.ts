import {
  DatabaseMovie,
  MovieWithDetails,
  MovieSearchFilters,
  MovieSearchResult
} from '@/models/Database'

export interface IMovieRepository {
  /**
   * Find all active movies
   */
  findAll(): Promise<DatabaseMovie[]>

  /**
   * Find movie by ID
   */
  findById(movieId: number): Promise<MovieWithDetails | null>

  /**
   * Search movies with filters
   */
  search(filters: MovieSearchFilters): Promise<MovieSearchResult[]>

  /**
   * Find movies by genre
   */
  findByGenre(genre: string): Promise<DatabaseMovie[]>

  /**
   * Find movies by language
   */
  findByLanguage(language: string): Promise<DatabaseMovie[]>

  /**
   * Find now showing movies (has active shows)
   */
  findNowShowing(city?: string): Promise<DatabaseMovie[]>

  /**
   * Find upcoming movies (release date in future)
   */
  findUpcoming(limit?: number): Promise<DatabaseMovie[]>

  /**
   * Find movies showing in a specific city
   */
  findByCity(city: string, date?: string): Promise<DatabaseMovie[]>

  /**
   * Get all unique genres
   */
  getGenres(): Promise<string[]>

  /**
   * Get all unique languages
   */
  getLanguages(): Promise<string[]>
}
