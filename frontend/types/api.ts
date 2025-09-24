import { Bus, SearchParams, FilterParams, SortOption, SearchResult } from './bus'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Search API types
export interface SearchBusesRequest extends SearchParams {
  filters?: FilterParams
  sort?: SortOption
  pagination?: PaginationParams
}

export interface SearchBusesResponse extends ApiResponse<SearchResult> {}

// Bus details API
export interface GetBusDetailsRequest {
  busId: string
}

export interface GetBusDetailsResponse extends ApiResponse<Bus> {}

// Cities API
export interface GetCitiesRequest {
  query?: string
  limit?: number
}

export interface GetCitiesResponse extends ApiResponse<Array<{ id: string; name: string; state: string }>> {}

// Error types
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ApiValidationError extends ApiError {
  code: 'VALIDATION_ERROR'
  details: {
    fields: ValidationError[]
  }
}