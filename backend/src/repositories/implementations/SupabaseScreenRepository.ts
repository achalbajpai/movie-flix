import { supabase } from '@/config/supabase'
import { logger } from '@/config/logger'
import {
  DatabaseScreen,
  ScreenWithDetails
} from '@/models/Database'
import { IScreenRepository } from '../interfaces/IScreenRepository'

export class SupabaseScreenRepository implements IScreenRepository {
  async findById(screenId: number): Promise<ScreenWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('screen')
        .select(`
          *,
          Theater(*)
        `)
        .eq('screen_id', screenId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        ...data,
        theater: data.Theater
      }
    } catch (error) {
      logger.error('Error finding screen by ID', { screenId, error })
      throw error
    }
  }

  async findByTheater(theaterId: number): Promise<DatabaseScreen[]> {
    try {
      const { data, error } = await supabase
        .from('screen')
        .select('*')
        .eq('theater_id', theaterId)
        .order('screen_number', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding screens by theater', { theaterId, error })
      throw error
    }
  }

  async findByType(screenType: string): Promise<DatabaseScreen[]> {
    try {
      const { data, error } = await supabase
        .from('screen')
        .select('*')
        .eq('screen_type', screenType)
        .order('screen_name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error finding screens by type', { screenType, error })
      throw error
    }
  }

  async getCapacity(screenId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('screen')
        .select('total_seats')
        .eq('screen_id', screenId)
        .single()

      if (error) throw error
      return data?.total_seats || 0
    } catch (error) {
      logger.error('Error getting screen capacity', { screenId, error })
      throw error
    }
  }

  async getScreenTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('screen')
        .select('screen_type')

      if (error) throw error

      const types = data ? Array.from(new Set(data.map(s => s.screen_type))) : []
      return types.sort()
    } catch (error) {
      logger.error('Error getting screen types', { error })
      throw error
    }
  }
}

export const createSupabaseScreenRepository = (): IScreenRepository => {
  return new SupabaseScreenRepository()
}
