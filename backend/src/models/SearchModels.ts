import { z } from 'zod'

// Zod schemas for validation - Movie Booking System
export const MovieSearchParamsSchema = z.object({
  city: z.string().min(1, 'City is required').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  movieId: z.number().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  tickets: z.number().min(1, 'At least 1 ticket required').max(10, 'Maximum 10 tickets allowed').optional()
})

export const ShowSearchParamsSchema = z.object({
  movieId: z.number().optional(),
  theaterId: z.number().optional(),
  city: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  screenType: z.string().optional()
})

export const FilterParamsSchema = z.object({
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  theaters: z.array(z.number()).optional(),
  screenTypes: z.array(z.string()).optional(), // IMAX, 3D, 4DX, Regular
  showTimeRange: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  genres: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  ratings: z.array(z.string()).optional(), // U, UA, A, R, PG-13
  imdbRating: z.number().min(0).max(10).optional(),
  onlyAvailable: z.boolean().optional()
})

export const SortOptionSchema = z.object({
  field: z.enum(['price', 'showTime', 'rating', 'popularity', 'title']),
  order: z.enum(['asc', 'desc'])
})

export const PaginationParamsSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')
})

// Type definitions derived from schemas
export type MovieSearchParams = z.infer<typeof MovieSearchParamsSchema>
export type ShowSearchParams = z.infer<typeof ShowSearchParamsSchema>
export type FilterParams = z.infer<typeof FilterParamsSchema>
export type SortOption = z.infer<typeof SortOptionSchema>
export type PaginationParams = z.infer<typeof PaginationParamsSchema>

export interface MovieSearchQuery {
  searchParams: MovieSearchParams
  filters?: FilterParams
  sort?: SortOption
  pagination?: PaginationParams
}

export interface ShowSearchQuery {
  searchParams: ShowSearchParams
  filters?: FilterParams
  sort?: SortOption
  pagination?: PaginationParams
}

export interface SearchFilters {
  availableTheaters: Array<{ id: number; name: string; showCount: number }>
  availableScreenTypes: Array<{ type: string; showCount: number }>
  availableGenres: Array<{ genre: string; movieCount: number }>
  availableLanguages: Array<{ language: string; movieCount: number }>
  priceRange: { min: number; max: number }
  showTimeSlots: Array<{ slot: string; showCount: number }>
}

export interface SearchResultMetadata {
  totalCount: number
  searchTime: number
  appliedFilters: FilterParams
  suggestedFilters?: FilterParams
}

export interface MovieSearchResultMetadata extends SearchResultMetadata {
  availableMovies: number
  availableShows: number
  citiesWithShows: string[]
}

export interface ShowSearchResultMetadata extends SearchResultMetadata {
  availableShows: number
  theatersWithShows: number
  earliestShowTime: string | null
  latestShowTime: string | null
}
