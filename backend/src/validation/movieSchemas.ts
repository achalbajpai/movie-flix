import { z } from 'zod'
import { commonValidations } from '@/utils/ValidationHelpers'

// Movie schemas
export const MovieIdParamsSchema = z.object({
  id: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive('Movie ID must be positive'))
})

export const MovieSearchQuerySchema = z.object({
  city: z.string().min(1, 'City is required').max(100, 'City too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  movieId: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive().optional()),
  genre: z.string().min(1).max(50).optional(),
  language: z.string().min(1).max(50).optional()
})

// Theater schemas
export const TheaterIdParamsSchema = z.object({
  theaterId: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive('Theater ID must be positive'))
})

export const CityParamsSchema = z.object({
  city: z.string().min(1, 'City is required').max(100, 'City too long')
})

export const TheaterSearchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters long').max(100, 'Query too long')
})

// Screen schemas
export const ScreenIdParamsSchema = z.object({
  id: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive('Screen ID must be positive'))
})

export const ScreenTypeParamsSchema = z.object({
  screenType: z.string().min(1).max(50)
})

// Show schemas
export const ShowIdParamsSchema = z.object({
  showId: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive('Show ID must be positive'))
})

export const ShowSearchQuerySchema = z.object({
  movieId: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive().optional()),
  theaterId: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive().optional()),
  city: z.string().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  screenType: z.string().min(1).max(50).optional()
})

export const UpcomingShowsQuerySchema = z.object({
  city: z.string().min(1).max(100).optional(),
  hours: z.preprocess((val) => val ? Number(val) : 24, z.number().int().min(1).max(168).default(24))
})
