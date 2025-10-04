import { createValidationFactory } from './ValidationFactory'
import {
  // Health schemas
  HealthCheckResponseSchema,
  ReadinessCheckResponseSchema,
  LivenessCheckResponseSchema,

  // Utility schemas
  PaginationQuerySchema,
  SortQuerySchema,
  FilterQuerySchema,
  CommonHeadersSchema,

  // Legacy schemas
  FilterParamsSchema,
  SortOptionSchema,
  PaginationParamsSchema
} from './schemas'

import {
  // Movie schemas
  MovieIdParamsSchema,
  MovieSearchQuerySchema,

  // Theater schemas
  TheaterIdParamsSchema,
  CityParamsSchema,
  TheaterSearchQuerySchema,

  // Screen schemas
  ScreenIdParamsSchema,
  ScreenTypeParamsSchema,

  // Show schemas
  ShowIdParamsSchema,
  ShowSearchQuerySchema,
  UpcomingShowsQuerySchema
} from './movieSchemas'

import { bookingValidationSchemas } from './BookingValidationSchemas'
import { logger } from '@/config'

// Create the global validation factory instance
export const validationFactory = createValidationFactory({
  mode: 'strict',
  strategy: 'throw',
  transform: true,
  stripUnknown: true,
  abortEarly: false
})

// Schema registration function
export const registerAllSchemas = (): void => {
  try {
    // Movie-related schemas
    validationFactory.registerSchema('movieId', MovieIdParamsSchema, 'Schema for movie ID path parameters')
    validationFactory.registerSchema('movieSearchQuery', MovieSearchQuerySchema, 'Schema for movie search query parameters')

    // Theater-related schemas
    validationFactory.registerSchema('theaterId', TheaterIdParamsSchema, 'Schema for theater ID path parameters')
    validationFactory.registerSchema('cityParams', CityParamsSchema, 'Schema for city path parameters')
    validationFactory.registerSchema('theaterSearchQuery', TheaterSearchQuerySchema, 'Schema for theater search query parameters')

    // Screen-related schemas
    validationFactory.registerSchema('screenId', ScreenIdParamsSchema, 'Schema for screen ID path parameters')
    validationFactory.registerSchema('screenType', ScreenTypeParamsSchema, 'Schema for screen type path parameters')

    // Show-related schemas
    validationFactory.registerSchema('showId', ShowIdParamsSchema, 'Schema for show ID path parameters')
    validationFactory.registerSchema('showSearchQuery', ShowSearchQuerySchema, 'Schema for show search query parameters')
    validationFactory.registerSchema('upcomingShowsQuery', UpcomingShowsQuerySchema, 'Schema for upcoming shows query parameters')

    // Health check schemas
    validationFactory.registerSchema('healthCheckResponse', HealthCheckResponseSchema, 'Schema for health check response')
    validationFactory.registerSchema('readinessCheckResponse', ReadinessCheckResponseSchema, 'Schema for readiness check response')
    validationFactory.registerSchema('livenessCheckResponse', LivenessCheckResponseSchema, 'Schema for liveness check response')

    // Generic utility schemas
    validationFactory.registerSchema('pagination', PaginationQuerySchema, 'Schema for pagination parameters')
    validationFactory.registerSchema('sort', SortQuerySchema, 'Schema for sort parameters')
    validationFactory.registerSchema('filter', FilterQuerySchema, 'Schema for filter parameters')
    validationFactory.registerSchema('commonHeaders', CommonHeadersSchema, 'Schema for common request headers')

    // Legacy schemas for backward compatibility
    // Legacy search schema removed - use movie/show specific search schemas instead
    validationFactory.registerSchema('filterParams', FilterParamsSchema, 'Legacy filter parameters schema')
    validationFactory.registerSchema('sortOption', SortOptionSchema, 'Legacy sort option schema')
    validationFactory.registerSchema('paginationParams', PaginationParamsSchema, 'Legacy pagination parameters schema')

    // Booking and seat schemas
    Object.entries(bookingValidationSchemas).forEach(([name, schema]) => {
      validationFactory.registerSchema(name, schema as any, `Schema for ${name} validation`)
    })

  } catch (error) {
    logger.error('Failed to register validation schemas', { error: (error as Error).message })
    throw error
  }
}

// Initialize schemas on module load
registerAllSchemas()

// Export commonly used validation helpers
export const validate = {
  // Movie validations
  movieId: (data: unknown) => validationFactory.validate('movieId', data),
  movieSearchQuery: (data: unknown) => validationFactory.validate('movieSearchQuery', data),

  // Theater validations
  theaterId: (data: unknown) => validationFactory.validate('theaterId', data),
  cityParams: (data: unknown) => validationFactory.validate('cityParams', data),
  theaterSearchQuery: (data: unknown) => validationFactory.validate('theaterSearchQuery', data),

  // Screen validations
  screenId: (data: unknown) => validationFactory.validate('screenId', data),
  screenType: (data: unknown) => validationFactory.validate('screenType', data),

  // Show validations
  showId: (data: unknown) => validationFactory.validate('showId', data, { strategy: 'safe' }),
  showSearchQuery: (data: unknown) => validationFactory.validate('showSearchQuery', data),
  upcomingShowsQuery: (data: unknown) => validationFactory.validate('upcomingShowsQuery', data),

  // Generic validations
  pagination: (data: unknown) => validationFactory.validate('pagination', data),
  sort: (data: unknown) => validationFactory.validate('sort', data),
  filter: (data: unknown) => validationFactory.validate('filter', data),
  commonHeaders: (data: unknown) => validationFactory.validate('commonHeaders', data),

  // Booking and seat validations - explicitly defined for TypeScript
  createBooking: (data: unknown) => validationFactory.validate('createBooking', data, { strategy: 'safe' }),
  updateBooking: (data: unknown) => validationFactory.validate('updateBooking', data, { strategy: 'safe' }),
  cancelBooking: (data: unknown) => validationFactory.validate('cancelBooking', data, { strategy: 'safe' }),
  bookingId: (data: unknown) => validationFactory.validate('bookingId', data, { strategy: 'safe' }),
  userId: (data: unknown) => validationFactory.validate('userId', data, { strategy: 'safe' }),
  bookingReference: (data: unknown) => validationFactory.validate('bookingReference', data, { strategy: 'safe' }),
  bookingStatusParam: (data: unknown) => validationFactory.validate('bookingStatusParam', data, { strategy: 'safe' }),
  bookingQuery: (data: unknown) => validationFactory.validate('bookingQuery', data, { strategy: 'safe' }),
  dateRange: (data: unknown) => validationFactory.validate('dateRange', data, { strategy: 'safe' }),
  bookingStatus: (data: unknown) => validationFactory.validate('bookingStatus', data, { strategy: 'safe' }),
  seatId: (data: unknown) => validationFactory.validate('seatId', data, { strategy: 'safe' }),
  seatNumber: (data: unknown) => validationFactory.validate('seatNumber', data, { strategy: 'safe' }),
  seatIds: (data: unknown) => validationFactory.validate('seatIds', data, { strategy: 'safe' }),
  seatStatus: (data: unknown) => validationFactory.validate('seatStatus', data, { strategy: 'safe' }),
  seatReservation: (data: unknown) => validationFactory.validate('seatReservation', data, { strategy: 'safe' }),
  reservationId: (data: unknown) => validationFactory.validate('reservationId', data, { strategy: 'safe' }),
  extensionMinutes: (data: unknown) => validationFactory.validate('extensionMinutes', data, { strategy: 'safe' })
}

// Export middleware creators
export const middleware = {
  // Movie middleware
  validateMovieId: () => validationFactory.createMiddleware('movieId', 'params'),
  validateMovieSearchQuery: () => validationFactory.createMiddleware('movieSearchQuery', 'query'),

  // Theater middleware
  validateTheaterId: () => validationFactory.createMiddleware('theaterId', 'params'),
  validateCityParams: () => validationFactory.createMiddleware('cityParams', 'params'),
  validateTheaterSearchQuery: () => validationFactory.createMiddleware('theaterSearchQuery', 'query'),

  // Screen middleware
  validateScreenId: () => validationFactory.createMiddleware('screenId', 'params'),
  validateScreenType: () => validationFactory.createMiddleware('screenType', 'params'),

  // Show middleware
  validateShowId: () => validationFactory.createMiddleware('showId', 'params'),
  validateShowSearchQuery: () => validationFactory.createMiddleware('showSearchQuery', 'query'),
  validateUpcomingShowsQuery: () => validationFactory.createMiddleware('upcomingShowsQuery', 'query'),

  // Generic middleware
  validatePagination: () => validationFactory.createMiddleware('pagination', 'query'),
  validateSort: () => validationFactory.createMiddleware('sort', 'query'),
  validateFilter: () => validationFactory.createMiddleware('filter', 'query'),
  validateCommonHeaders: () => validationFactory.createMiddleware('commonHeaders', 'headers')
}

export const safeValidate = {
  movieId: (data: unknown) => validationFactory.validate('movieId', data, { strategy: 'safe' }),
  movieSearchQuery: (data: unknown) => validationFactory.validate('movieSearchQuery', data, { strategy: 'safe' }),
  theaterId: (data: unknown) => validationFactory.validate('theaterId', data, { strategy: 'safe' }),
  cityParams: (data: unknown) => validationFactory.validate('cityParams', data, { strategy: 'safe' }),
  theaterSearchQuery: (data: unknown) => validationFactory.validate('theaterSearchQuery', data, { strategy: 'safe' }),
  screenId: (data: unknown) => validationFactory.validate('screenId', data, { strategy: 'safe' }),
  screenType: (data: unknown) => validationFactory.validate('screenType', data, { strategy: 'safe' }),
  showId: (data: unknown) => validationFactory.validate('showId', data, { strategy: 'safe' }),
  showSearchQuery: (data: unknown) => validationFactory.validate('showSearchQuery', data, { strategy: 'safe' }),
  upcomingShowsQuery: (data: unknown) => validationFactory.validate('upcomingShowsQuery', data, { strategy: 'safe' }),
  pagination: (data: unknown) => validationFactory.validate('pagination', data, { strategy: 'safe' }),
  sort: (data: unknown) => validationFactory.validate('sort', data, { strategy: 'safe' }),
  filter: (data: unknown) => validationFactory.validate('filter', data, { strategy: 'safe' }),
  commonHeaders: (data: unknown) => validationFactory.validate('commonHeaders', data, { strategy: 'safe' }),

  // Booking and seat safe validations
  createBooking: (data: unknown) => validationFactory.validate('createBooking', data, { strategy: 'safe' }),
  updateBooking: (data: unknown) => validationFactory.validate('updateBooking', data, { strategy: 'safe' }),
  cancelBooking: (data: unknown) => validationFactory.validate('cancelBooking', data, { strategy: 'safe' }),
  bookingId: (data: unknown) => validationFactory.validate('bookingId', data, { strategy: 'safe' }),
  userId: (data: unknown) => validationFactory.validate('userId', data, { strategy: 'safe' }),
  bookingReference: (data: unknown) => validationFactory.validate('bookingReference', data, { strategy: 'safe' }),
  bookingStatusParam: (data: unknown) => validationFactory.validate('bookingStatusParam', data, { strategy: 'safe' }),
  bookingQuery: (data: unknown) => validationFactory.validate('bookingQuery', data, { strategy: 'safe' }),
  dateRange: (data: unknown) => validationFactory.validate('dateRange', data, { strategy: 'safe' }),
  bookingStatus: (data: unknown) => validationFactory.validate('bookingStatus', data, { strategy: 'safe' }),
  seatId: (data: unknown) => validationFactory.validate('seatId', data, { strategy: 'safe' }),
  seatNumber: (data: unknown) => validationFactory.validate('seatNumber', data, { strategy: 'safe' }),
  seatIds: (data: unknown) => validationFactory.validate('seatIds', data, { strategy: 'safe' }),
  seatStatus: (data: unknown) => validationFactory.validate('seatStatus', data, { strategy: 'safe' }),
  seatReservation: (data: unknown) => validationFactory.validate('seatReservation', data, { strategy: 'safe' }),
  reservationId: (data: unknown) => validationFactory.validate('reservationId', data, { strategy: 'safe' }),
  extensionMinutes: (data: unknown) => validationFactory.validate('extensionMinutes', data, { strategy: 'safe' })
}

export { ValidationFactory, createValidationFactory } from './ValidationFactory'
export * from './types'
export * from './schemas'
export * from './movieSchemas'