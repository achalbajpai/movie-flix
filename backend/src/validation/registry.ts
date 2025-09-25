import { createValidationFactory } from './ValidationFactory'
import {
  // Bus schemas
  BusSearchQuerySchema,
  BusIdParamsSchema,
  OperatorIdParamsSchema,
  RouteIdParamsSchema,

  // City schemas
  CitySearchQuerySchema,
  CityIdParamsSchema,
  PopularCitiesQuerySchema,

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
  SearchParamsSchema,
  FilterParamsSchema,
  SortOptionSchema,
  PaginationParamsSchema
} from './schemas'
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
  logger.info('Registering validation schemas...')

  try {
    // Bus-related schemas
    validationFactory.registerSchema('busSearchQuery', BusSearchQuerySchema, 'Schema for bus search query parameters')
    validationFactory.registerSchema('busIdParams', BusIdParamsSchema, 'Schema for bus ID path parameters')
    validationFactory.registerSchema('operatorIdParams', OperatorIdParamsSchema, 'Schema for operator ID path parameters')
    validationFactory.registerSchema('routeIdParams', RouteIdParamsSchema, 'Schema for route ID path parameters')

    // City-related schemas
    validationFactory.registerSchema('citySearchQuery', CitySearchQuerySchema as any, 'Schema for city search query parameters')
    validationFactory.registerSchema('cityIdParams', CityIdParamsSchema, 'Schema for city ID path parameters')
    validationFactory.registerSchema('popularCitiesQuery', PopularCitiesQuerySchema, 'Schema for popular cities query parameters')

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
    validationFactory.registerSchema('searchParams', SearchParamsSchema, 'Legacy search parameters schema')
    validationFactory.registerSchema('filterParams', FilterParamsSchema, 'Legacy filter parameters schema')
    validationFactory.registerSchema('sortOption', SortOptionSchema, 'Legacy sort option schema')
    validationFactory.registerSchema('paginationParams', PaginationParamsSchema, 'Legacy pagination parameters schema')

    const registeredCount = validationFactory.listSchemas().length
    logger.info(`Successfully registered ${registeredCount} validation schemas`, {
      schemas: validationFactory.listSchemas()
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
  // Bus validations
  busSearchQuery: (data: unknown) => validationFactory.validate('busSearchQuery', data),
  busId: (data: unknown) => validationFactory.validate('busIdParams', data),
  operatorId: (data: unknown) => validationFactory.validate('operatorIdParams', data),
  routeId: (data: unknown) => validationFactory.validate('routeIdParams', data),

  // City validations
  citySearchQuery: (data: unknown) => validationFactory.validate('citySearchQuery', data),
  cityId: (data: unknown) => validationFactory.validate('cityIdParams', data),
  popularCitiesQuery: (data: unknown) => validationFactory.validate('popularCitiesQuery', data),

  // Generic validations
  pagination: (data: unknown) => validationFactory.validate('pagination', data),
  sort: (data: unknown) => validationFactory.validate('sort', data),
  filter: (data: unknown) => validationFactory.validate('filter', data),
  commonHeaders: (data: unknown) => validationFactory.validate('commonHeaders', data)
}

// Export middleware creators
export const middleware = {
  // Bus middleware
  validateBusSearchQuery: () => validationFactory.createMiddleware('busSearchQuery', 'query'),
  validateBusId: () => validationFactory.createMiddleware('busIdParams', 'params'),
  validateOperatorId: () => validationFactory.createMiddleware('operatorIdParams', 'params'),
  validateRouteId: () => validationFactory.createMiddleware('routeIdParams', 'params'),

  // City middleware
  validateCitySearchQuery: () => validationFactory.createMiddleware('citySearchQuery', 'query'),
  validateCityId: () => validationFactory.createMiddleware('cityIdParams', 'params'),
  validatePopularCitiesQuery: () => validationFactory.createMiddleware('popularCitiesQuery', 'query'),

  // Generic middleware
  validatePagination: () => validationFactory.createMiddleware('pagination', 'query'),
  validateSort: () => validationFactory.createMiddleware('sort', 'query'),
  validateFilter: () => validationFactory.createMiddleware('filter', 'query'),
  validateCommonHeaders: () => validationFactory.createMiddleware('commonHeaders', 'headers')
}

export const safeValidate = {
  busSearchQuery: (data: unknown) => validationFactory.validate('busSearchQuery', data, { strategy: 'safe' }),
  busId: (data: unknown) => validationFactory.validate('busIdParams', data, { strategy: 'safe' }),
  operatorId: (data: unknown) => validationFactory.validate('operatorIdParams', data, { strategy: 'safe' }),
  routeId: (data: unknown) => validationFactory.validate('routeIdParams', data, { strategy: 'safe' }),
  citySearchQuery: (data: unknown) => validationFactory.validate('citySearchQuery', data, { strategy: 'safe' }),
  cityId: (data: unknown) => validationFactory.validate('cityIdParams', data, { strategy: 'safe' }),
  popularCitiesQuery: (data: unknown) => validationFactory.validate('popularCitiesQuery', data, { strategy: 'safe' }),
  pagination: (data: unknown) => validationFactory.validate('pagination', data, { strategy: 'safe' }),
  sort: (data: unknown) => validationFactory.validate('sort', data, { strategy: 'safe' }),
  filter: (data: unknown) => validationFactory.validate('filter', data, { strategy: 'safe' }),
  commonHeaders: (data: unknown) => validationFactory.validate('commonHeaders', data, { strategy: 'safe' })
}

export { ValidationFactory, createValidationFactory } from './ValidationFactory'
export * from './types'
export * from './schemas'