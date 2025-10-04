import { supabase } from '@/config/supabase'
import { logger } from '@/config/logger'
import {
  DatabaseTheater,
  TheaterWithDetails
} from '@/models/Database'
import { ITheaterRepository } from '../interfaces/ITheaterRepository'

export class SupabaseTheaterRepository implements ITheaterRepository {
  async findAll(): Promise<DatabaseTheater[]> {
    try {
      const { data, error } = await supabase
        .from('theater')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding all theaters', { error })
      throw error
    }
  }

  async findById(theaterId: number): Promise<TheaterWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('theater')
        .select(`
          *,
          screen(*)
        `)
        .eq('theater_id', theaterId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        ...data,
        screens: data.screen || []
      }
    } catch (error) {
      logger.error('Error finding theater by ID', { theaterId, error })
      throw error
    }
  }

  async findByCity(city: string): Promise<DatabaseTheater[]> {
    try {
      const { data, error } = await supabase
        .from('theater')
        .select('*')
        .ilike('city', city)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding theaters by city', { city, error })
      throw error
    }
  }

  async findVerified(): Promise<DatabaseTheater[]> {
    try {
      const { data, error } = await supabase
        .from('theater')
        .select('*')
        .eq('verification', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding verified theaters', { error })
      throw error
    }
  }

  async findByMovie(movieId: number, city?: string): Promise<DatabaseTheater[]> {
    try {
      let query = supabase
        .from('theater')
        .select(`
          *,
          screen!inner(
            show!inner(
              movie_id
            )
          )
        `)
        .eq('screen.show.movie_id', movieId)
        .eq('screen.show.is_active', true)

      if (city) {
        query = query.ilike('city', city)
      }

      const { data, error } = await query

      if (error) throw error

      // Remove duplicates
      const uniqueTheaters = data ? Array.from(
        new Map(data.map(theater => [theater.theater_id, theater])).values()
      ) : []

      return uniqueTheaters
    } catch (error) {
      logger.error('Error finding theaters by movie', { movieId, city, error })
      throw error
    }
  }

  async getCities(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('theater')
        .select('city')

      if (error) throw error

      const cities = data ? Array.from(new Set(data.map(t => t.city))) : []
      return cities.sort()
    } catch (error) {
      logger.error('Error getting cities', { error })
      throw error
    }
  }

  async search(query: string): Promise<DatabaseTheater[]> {
    try {
      const { data, error } = await supabase
        .from('theater')
        .select('*')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%,city.ilike.%${query}%`)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error searching theaters', { query, error })
      throw error
    }
  }
}

export const createSupabaseTheaterRepository = (): ITheaterRepository => {
  return new SupabaseTheaterRepository()
}
