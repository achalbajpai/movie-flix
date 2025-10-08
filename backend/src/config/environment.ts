import { config } from 'dotenv'
import { z } from 'zod'

// Load environment variables
config()

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_VERSION: z.string().default('v1'),
  API_BASE_PATH: z.string().default('/api'),

  // Supabase Configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Rate limiting
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'), // minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Business Configuration (Optional overrides)
  SEAT_RESERVATION_TIMEOUT_MINUTES: z.string().transform(Number).optional(),
  DEFAULT_PAGE_SIZE: z.string().transform(Number).optional(),
  MAX_PAGE_SIZE: z.string().transform(Number).optional(),
  REFUND_POLICY_HOURS: z.string().transform(Number).optional(),
  MAX_SEATS_PER_BOOKING: z.string().transform(Number).optional(),
  MIN_ADVANCE_BOOKING_MINUTES: z.string().transform(Number).optional(),
})

const parseEnvironment = () => {
  try {
    return environmentSchema.parse(process.env)
  } catch (error) {
    console.error('Environment validation failed:', error)
    process.exit(1)
  }
}

export const env = parseEnvironment()

export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

export default env