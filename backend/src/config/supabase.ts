import { createClient } from '@supabase/supabase-js'
import { env } from './environment'
import { logger } from './logger'

// Create Supabase client with service role for server-side operations
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Test connection function
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('User')
      .select('count(*)')
      .limit(1)

    if (error) {
      logger.error('Supabase connection test failed', { error: error.message })
      return false
    }

    logger.info('Supabase connection successful')
    return true
  } catch (error) {
    logger.error('Supabase connection test error', { error: (error as Error).message })
    return false
  }
}

export default supabase