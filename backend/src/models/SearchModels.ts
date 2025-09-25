import { z } from 'zod'

// Zod schemas for validation
export const SearchParamsSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  passengers: z.number().min(1, 'At least 1 passenger required').max(4, 'Maximum 4 passengers allowed')
})

export const FilterParamsSchema = z.object({
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  operators: z.array(z.string()).optional(),
  busTypes: z.array(z.string()).optional(),
  departureTimeRange: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  amenities: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional()
})

export const SortOptionSchema = z.object({
  field: z.enum(['price', 'duration', 'rating', 'departure', 'arrival']),
  order: z.enum(['asc', 'desc'])
})

export const PaginationParamsSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')
})

// Type definitions derived from schemas
export type SearchParams = z.infer<typeof SearchParamsSchema>
export type FilterParams = z.infer<typeof FilterParamsSchema>
export type SortOption = z.infer<typeof SortOptionSchema>
export type PaginationParams = z.infer<typeof PaginationParamsSchema>

export interface SearchQuery {
  searchParams: SearchParams
  filters?: FilterParams
  sort?: SortOption
  pagination?: PaginationParams
}

export interface SearchFilters {
  availableOperators: Array<{ id: string; name: string; busCount: number }>
  availableBusTypes: Array<{ id: string; name: string; busCount: number }>
  priceRange: { min: number; max: number }
  availableAmenities: Array<{ id: string; name: string; busCount: number }>
  departureTimeSlots: Array<{ slot: string; busCount: number }>
}

export interface SearchResultMetadata {
  totalCount: number
  searchTime: number
  appliedFilters: FilterParams
  suggestedFilters?: FilterParams
}