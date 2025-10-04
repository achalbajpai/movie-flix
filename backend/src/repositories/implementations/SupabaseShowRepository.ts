import { supabase } from '@/config/supabase'
import { logger } from '@/config/logger'
import {
  DatabaseShow,
  ShowWithDetails,
  ShowSearchFilters,
  ShowSearchResult
} from '@/models/Database'
import { IShowRepository } from '../interfaces/IShowRepository'

export class SupabaseShowRepository implements IShowRepository {
  async findById(showId: number): Promise<ShowWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen(
            *,
            theater(*)
          ),
          Seat(*)
        `)
        .eq('show_id', showId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      // Count available seats
      const availableSeats = data.Seat?.filter((seat: any) => !seat.is_reserved).length || 0

      return {
        ...data,
        movie: data.movie,
        screen: {
          ...data.screen,
          theater: data.screen?.theater
        },
        theater: data.screen?.theater,
        seats: data.Seat,
        available_seats: availableSeats
      }
    } catch (error) {
      logger.error('Error finding show by ID', { showId, error })
      throw error
    }
  }

  async search(filters: ShowSearchFilters): Promise<ShowSearchResult[]> {
    try {
      let query = supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen(
            *,
            theater(*)
          ),
          Seat(seat_id, is_reserved)
        `)
        .eq('is_active', true)

      if (filters.movieId) {
        query = query.eq('movie_id', filters.movieId)
      }

      if (filters.screenId) {
        query = query.eq('screen_id', filters.screenId)
      }

      if (filters.screenType) {
        query = query.eq('screen.screen_type', filters.screenType)
      }

      if (filters.city) {
        query = query.eq('screen.theater.city', filters.city)
      }

      if (filters.date) {
        const startDate = new Date(filters.date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(filters.date)
        endDate.setHours(23, 59, 59, 999)
        query = query.gte('show_time', startDate.toISOString())
        query = query.lte('show_time', endDate.toISOString())
      }

      if (filters.timeStart) {
        query = query.gte('show_time', filters.timeStart)
      }

      if (filters.timeEnd) {
        query = query.lte('show_time', filters.timeEnd)
      }

      const { data, error } = await query

      if (error) throw error

      const results: ShowSearchResult[] = (data || []).map((show: any) => {
        const availableSeats = show.Seat?.filter((seat: any) => !seat.is_reserved).length || 0
        const totalSeats = show.Seat?.length || show.screen?.total_seats || 0

        return {
          show_id: show.show_id,
          movie_id: show.movie_id,
          movie_title: show.movie?.title,
          movie_poster: show.movie?.poster_url,
          movie_duration: show.movie?.duration,
          movie_genre: show.movie?.genre,
          movie_rating: show.movie?.rating,
          theater_id: show.screen?.theater?.theater_id,
          theater_name: show.screen?.theater?.name,
          theater_location: show.screen?.theater?.location,
          theater_city: show.screen?.theater?.city,
          screen_id: show.screen_id,
          screen_name: show.screen?.screen_name,
          screen_type: show.screen?.screen_type,
          show_time: show.show_time,
          end_time: show.end_time,
          base_price: show.base_price,
          available_seats: availableSeats,
          total_seats: totalSeats,
          language: show.language,
          subtitles: show.subtitles
        }
      })

      // Filter by available seats if required
      if (filters.onlyAvailable) {
        return results.filter(r => r.available_seats > 0)
      }

      return results
    } catch (error) {
      logger.error('Error searching shows', { filters, error })
      throw error
    }
  }

  async findByMovie(movieId: number, date?: string, city?: string): Promise<ShowWithDetails[]> {
    try {
      logger.info('=== FIND BY MOVIE START ===', { movieId, date, city })

      // Build base query with left joins (not inner)
      let query = supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen(
            *,
            theater(*)
          )
        `)
        .eq('movie_id', movieId)
        .eq('is_active', true)
        .order('show_time', { ascending: true })

      // Only filter by date if provided
      if (date) {
        // Parse date - handle different formats
        let parsedDate: Date

        // Check if date is in YYYY-MM-DD format or needs parsing
        if (date.includes('-')) {
          parsedDate = new Date(date)
        } else if (date.includes('/')) {
          // Handle MM/DD/YYYY or DD/MM/YYYY format
          const parts = date.split('/')
          if (parts.length === 3) {
            // Assume MM/DD/YYYY
            parsedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
          } else {
            parsedDate = new Date(date)
          }
        } else {
          parsedDate = new Date(date)
        }

        const startDate = new Date(parsedDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(parsedDate)
        endDate.setHours(23, 59, 59, 999)

        logger.info('Filtering shows by date', {
          originalDate: date,
          parsedDate: parsedDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })

        query = query.gte('show_time', startDate.toISOString())
        query = query.lte('show_time', endDate.toISOString())
      } else {
        // If no date provided, show future shows only
        logger.info('No date filter, showing all future shows')
        query = query.gte('show_time', new Date().toISOString())
      }

      const { data, error } = await query

      if (error) {
        logger.error('Supabase error in findByMovie', { error, movieId, date, city })
        throw error
      }

      logger.info('Shows found before filtering', {
        count: data?.length || 0,
        movieId,
        city,
        date,
        sampleShow: data?.[0] ? {
          show_id: data[0].show_id,
          show_time: data[0].show_time,
          hasScreen: !!data[0].screen,
          hasTheater: !!data[0].screen?.theater,
          theaterCity: data[0].screen?.theater?.city
        } : null
      })

      // Filter by city in-memory if provided (since nested filters don't work well)
      let filteredData = data || []
      if (city) {
        logger.info('Filtering shows by city in memory', { city })
        filteredData = filteredData.filter((show: any) => {
          const theaterCity = show.screen?.theater?.city
          logger.info('Comparing cities', {
            theaterCity,
            searchCity: city,
            match: theaterCity?.toLowerCase() === city.toLowerCase()
          })
          if (!theaterCity) return false
          return theaterCity.toLowerCase() === city.toLowerCase()
        })
        logger.info('Shows after city filter', { count: filteredData.length })
      }

      // Get available seats count for each show
      logger.info('Fetching seat counts for shows', { count: filteredData.length })
      const showsWithSeats = await Promise.all(
        filteredData.map(async (show: any) => {
          const availableSeats = await this.getAvailableSeatsCount(show.show_id)

          return {
            ...show,
            movie: show.movie,
            screen: {
              ...show.screen,
              theater: show.screen?.theater
            },
            theater: show.screen?.theater,
            available_seats: availableSeats
          }
        })
      )

      logger.info('=== FIND BY MOVIE END ===', { finalCount: showsWithSeats.length })

      return showsWithSeats
    } catch (error) {
      logger.error('Error finding shows by movie', { movieId, date, city, error })
      throw error
    }
  }

  async findByTheater(theaterId: number, date?: string): Promise<ShowWithDetails[]> {
    try {
      let query = supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen!inner(
            *,
            theater!inner(*)
          )
        `)
        .eq('screen.theater.theater_id', theaterId)
        .eq('is_active', true)
        .order('show_time', { ascending: true })

      if (date) {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
        query = query.gte('show_time', startDate.toISOString())
        query = query.lte('show_time', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((show: any) => ({
        ...show,
        movie: show.movie,
        screen: {
          ...show.screen,
          theater: show.screen?.theater
        },
        theater: show.screen?.theater
      }))
    } catch (error) {
      logger.error('Error finding shows by theater', { theaterId, date, error })
      throw error
    }
  }

  async findByScreen(screenId: number, date?: string): Promise<ShowWithDetails[]> {
    try {
      let query = supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen(
            *,
            theater(*)
          )
        `)
        .eq('screen_id', screenId)
        .eq('is_active', true)
        .order('show_time', { ascending: true })

      if (date) {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
        query = query.gte('show_time', startDate.toISOString())
        query = query.lte('show_time', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((show: any) => ({
        ...show,
        movie: show.movie,
        screen: {
          ...show.screen,
          theater: show.screen?.theater
        },
        theater: show.screen?.theater
      }))
    } catch (error) {
      logger.error('Error finding shows by screen', { screenId, date, error })
      throw error
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<ShowWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen(
            *,
            theater(*)
          )
        `)
        .gte('show_time', startDate)
        .lte('show_time', endDate)
        .eq('is_active', true)
        .order('show_time', { ascending: true })

      if (error) throw error

      return (data || []).map((show: any) => ({
        ...show,
        movie: show.movie,
        screen: {
          ...show.screen,
          theater: show.screen?.theater
        },
        theater: show.screen?.theater
      }))
    } catch (error) {
      logger.error('Error finding shows by date range', { startDate, endDate, error })
      throw error
    }
  }

  async findByCityAndDate(city: string, date: string): Promise<ShowWithDetails[]> {
    try {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('show')
        .select(`
          *,
          movie(*),
          screen!inner(
            *,
            theater!inner(*)
          )
        `)
        .eq('screen.theater.city', city)
        .gte('show_time', startDate.toISOString())
        .lte('show_time', endDate.toISOString())
        .eq('is_active', true)
        .order('show_time', { ascending: true })

      if (error) throw error

      return (data || []).map((show: any) => ({
        ...show,
        movie: show.movie,
        screen: {
          ...show.screen,
          theater: show.screen?.theater
        },
        theater: show.screen?.theater
      }))
    } catch (error) {
      logger.error('Error finding shows by city and date', { city, date, error })
      throw error
    }
  }

  async getAvailableSeatsCount(showId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('Seat')
        .select('*', { count: 'exact', head: true })
        .eq('show_id', showId)
        .eq('is_reserved', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      logger.error('Error getting available seats count', { showId, error })
      throw error
    }
  }

  async hasAvailableSeats(showId: number, requiredSeats: number): Promise<boolean> {
    try {
      const availableCount = await this.getAvailableSeatsCount(showId)
      return availableCount >= requiredSeats
    } catch (error) {
      logger.error('Error checking available seats', { showId, requiredSeats, error })
      throw error
    }
  }
}

export const createSupabaseShowRepository = (): IShowRepository => {
  return new SupabaseShowRepository()
}
