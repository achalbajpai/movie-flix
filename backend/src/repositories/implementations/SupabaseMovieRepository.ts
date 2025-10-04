import { supabase } from '@/config/supabase'
import { logger } from '@/config/logger'
import {
  DatabaseMovie,
  MovieWithDetails,
  MovieSearchFilters,
  MovieSearchResult
} from '@/models/Database'
import { IMovieRepository } from '../interfaces/IMovieRepository'

export class SupabaseMovieRepository implements IMovieRepository {
  async findAll(): Promise<DatabaseMovie[]> {
    try {
      const { data, error } = await supabase
        .from('movie')
        .select('*')
        .eq('is_active', true)
        .order('release_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding all movies', { error })
      throw error
    }
  }

  async findById(movieId: number): Promise<MovieWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('movie')
        .select('*')
        .eq('movie_id', movieId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error finding movie by ID', { movieId, error })
      throw error
    }
  }

  async search(filters: MovieSearchFilters): Promise<MovieSearchResult[]> {
    try {
      // Build complex query with joins to get show information
      let query = supabase
        .from('movie')
        .select(`
          movie_id,
          title,
          description,
          duration,
          genre,
          language,
          rating,
          poster_url,
          imdb_rating
        `)
        .eq('is_active', true)

      // Apply filters
      if (filters.genre) {
        query = query.eq('genre', filters.genre)
      }

      if (filters.language) {
        query = query.eq('language', filters.language)
      }

      if (filters.rating) {
        query = query.eq('rating', filters.rating)
      }

      const { data: movies, error } = await query

      if (error) throw error

      // For each movie, get show count, min price, and theaters
      const results: MovieSearchResult[] = await Promise.all(
        (movies || []).map(async (movie) => {
          const showQuery = supabase
            .from('show')
            .select(`
              show_id,
              base_price,
              Screen!inner(
                Theater!inner(
                  name,
                  city
                )
              )
            `)
            .eq('movie_id', movie.movie_id)
            .eq('is_active', true)

          if (filters.city) {
            showQuery.eq('screen.theater.city', filters.city)
          }

          if (filters.date) {
            const startDate = new Date(filters.date)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(filters.date)
            endDate.setHours(23, 59, 59, 999)
            showQuery.gte('show_time', startDate.toISOString())
            showQuery.lte('show_time', endDate.toISOString())
          }

          const { data: shows } = await showQuery

          const showCount = shows?.length || 0
          const minPrice = shows && shows.length > 0
            ? Math.min(...shows.map((s: any) => s.base_price))
            : 0
          const theaters = shows
            ? Array.from(new Set(shows.map((s: any) => s.screen.theater.name)))
            : []

          return {
            movie_id: movie.movie_id,
            title: movie.title,
            description: movie.description,
            duration: movie.duration,
            genre: movie.genre,
            language: movie.language,
            rating: movie.rating,
            poster_url: movie.poster_url,
            imdb_rating: movie.imdb_rating,
            show_count: showCount,
            min_price: minPrice,
            theaters
          }
        })
      )

      // Filter out movies with no shows if onlyAvailable is true
      if (filters.onlyAvailable) {
        return results.filter(r => r.show_count > 0)
      }

      return results
    } catch (error) {
      logger.error('Error searching movies', { filters, error })
      throw error
    }
  }

  async findByGenre(genre: string): Promise<DatabaseMovie[]> {
    try {
      const { data, error } = await supabase
        .from('movie')
        .select('*')
        .eq('genre', genre)
        .eq('is_active', true)
        .order('imdb_rating', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding movies by genre', { genre, error })
      throw error
    }
  }

  async findByLanguage(language: string): Promise<DatabaseMovie[]> {
    try {
      const { data, error } = await supabase
        .from('movie')
        .select('*')
        .eq('language', language)
        .eq('is_active', true)
        .order('release_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding movies by language', { language, error })
      throw error
    }
  }

  async findNowShowing(city?: string): Promise<DatabaseMovie[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let query = supabase
        .from('movie')
        .select(`
          *,
          Show!inner(
            show_id,
            Screen!inner(
              Theater!inner(
                city
              )
            )
          )
        `)
        .eq('is_active', true)
        .eq('show.is_active', true)
        .gte('show.show_time', today.toISOString())

      if (city) {
        query = query.eq('show.screen.theater.city', city)
      }

      const { data, error } = await query

      if (error) throw error

      // Remove duplicates
      const uniqueMovies = data ? Array.from(
        new Map(data.map(movie => [movie.movie_id, movie])).values()
      ) : []

      return uniqueMovies
    } catch (error) {
      logger.error('Error finding now showing movies', { city, error })
      throw error
    }
  }

  async findUpcoming(limit: number = 10): Promise<DatabaseMovie[]> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('movie')
        .select('*')
        .eq('is_active', true)
        .gt('release_date', today)
        .order('release_date', { ascending: true })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding upcoming movies', { limit, error })
      throw error
    }
  }

  async findByCity(city: string, date?: string): Promise<DatabaseMovie[]> {
    try {
      let query = supabase
        .from('movie')
        .select(`
          *,
          Show!inner(
            show_id,
            show_time,
            Screen!inner(
              Theater!inner(
                city
              )
            )
          )
        `)
        .eq('is_active', true)
        .eq('show.is_active', true)
        .eq('show.screen.theater.city', city)

      if (date) {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
        query = query.gte('show.show_time', startDate.toISOString())
        query = query.lte('show.show_time', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Remove duplicates
      const uniqueMovies = data ? Array.from(
        new Map(data.map(movie => [movie.movie_id, movie])).values()
      ) : []

      return uniqueMovies
    } catch (error) {
      logger.error('Error finding movies by city', { city, date, error })
      throw error
    }
  }

  async getGenres(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('movie')
        .select('genre')
        .eq('is_active', true)

      if (error) throw error

      const genres = data ? Array.from(new Set(data.map(m => m.genre))) : []
      return genres.sort()
    } catch (error) {
      logger.error('Error getting genres', { error })
      throw error
    }
  }

  async getLanguages(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('movie')
        .select('language')
        .eq('is_active', true)

      if (error) throw error

      const languages = data ? Array.from(new Set(data.map(m => m.language))) : []
      return languages.sort()
    } catch (error) {
      logger.error('Error getting languages', { error })
      throw error
    }
  }
}

export const createSupabaseMovieRepository = (): IMovieRepository => {
  return new SupabaseMovieRepository()
}
