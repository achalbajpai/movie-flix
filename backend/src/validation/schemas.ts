import { z } from 'zod'
import { commonValidations } from '@/utils/ValidationHelpers'

export {
  FilterParamsSchema,
  SortOptionSchema,
  PaginationParamsSchema
} from '@/models/SearchModels'

// Bus-related schemas
export const BusSearchQuerySchema = z.object({
  source: z.string().min(1, 'Source city is required').max(100, 'Source city too long'),
  destination: z.string().min(1, 'Destination city is required').max(100, 'Destination city too long'),
  departureDate: commonValidations.dateString,
  returnDate: commonValidations.dateString.optional(),
  passengers: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().int().min(1, 'At least 1 passenger required').max(9, 'Maximum 9 passengers allowed')
  ),

  // Filters
  priceMin: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(0, 'Minimum price cannot be negative').optional()),
  priceMax: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(0, 'Maximum price cannot be negative').optional()),
  operators: z.preprocess((val) => typeof val === 'string' ? val.split(',') : val, z.array(z.string()).optional()),
  busTypes: z.preprocess((val) => typeof val === 'string' ? val.split(',') : val, z.array(z.string()).optional()),
  departureTimeStart: commonValidations.timeString.optional(),
  departureTimeEnd: commonValidations.timeString.optional(),
  amenities: z.preprocess((val) => typeof val === 'string' ? val.split(',') : val, z.array(z.string()).optional()),
  rating: z.preprocess((val) => val ? Number(val) : undefined, commonValidations.rating.optional()),

  // Sorting
  sortBy: z.enum(['price', 'duration', 'rating', 'departure', 'arrival']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),

  // Pagination
  page: z.preprocess((val) => val ? Number(val) : 1, z.number().int().min(1, 'Page must be at least 1').default(1)),
  limit: z.preprocess((val) => val ? Number(val) : 20, z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20))
}).refine(
  data => !data.priceMax || !data.priceMin || data.priceMax >= data.priceMin,
  {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['priceMax']
  }
).refine(
  data => !data.departureTimeEnd || !data.departureTimeStart || data.departureTimeEnd >= data.departureTimeStart,
  {
    message: 'End time must be after start time',
    path: ['departureTimeEnd']
  }
)

export const BusIdParamsSchema = z.object({
  id: commonValidations.objectId.regex(/^\d+$/, 'Bus ID must be a valid number')
})

export const OperatorIdParamsSchema = z.object({
  operatorId: commonValidations.objectId.regex(/^\d+$/, 'Operator ID must be a valid number')
})

export const RouteIdParamsSchema = z.object({
  routeId: commonValidations.objectId.regex(/^\d+$/, 'Route ID must be a valid number')
})

// City-related schemas
export const CitySearchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters long').max(100, 'Query too long').optional(),
  query: z.string().min(2, 'Query must be at least 2 characters long').max(100, 'Query too long').optional(),
  limit: z.preprocess((val) => val ? Number(val) : 10, z.number().int().min(1, 'Limit must be at least 1').max(50, 'Limit cannot exceed 50').default(10))
}).transform(data => ({
  query: data.q || data.query || '',
  limit: data.limit
}))

export const CityIdParamsSchema = z.object({
  id: commonValidations.objectId.min(1, 'City ID is required')
})

export const PopularCitiesQuerySchema = z.object({
  limit: z.preprocess((val) => val ? Number(val) : 8, z.number().int().min(1, 'Limit must be at least 1').max(20, 'Limit cannot exceed 20').default(8))
})

// Health check schemas
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
  environment: z.string(),
  version: z.string(),
  memory: z.object({
    used: z.number().nonnegative(),
    total: z.number().nonnegative(),
    external: z.number().nonnegative()
  }),
  cpu: z.object({
    user: z.number().nonnegative(),
    system: z.number().nonnegative()
  })
})

export const ReadinessCheckResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  checks: z.record(z.enum(['healthy', 'unhealthy'])),
  timestamp: z.string().datetime()
})

export const LivenessCheckResponseSchema = z.object({
  status: z.enum(['alive']),
  timestamp: z.string().datetime(),
  pid: z.number().positive()
})

// Generic utility schemas
export const PaginationQuerySchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  offset: z.number().int().min(0, 'Offset cannot be negative').optional()
}).transform(data => ({
  ...data,
  offset: data.offset ?? (data.page - 1) * data.limit
}))

export const SortQuerySchema = z.object({
  sortBy: z.string().min(1, 'Sort field is required').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional()
})

export const FilterQuerySchema = z.object({
  search: z.string().max(200, 'Search term too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  dateFrom: commonValidations.dateString.optional(),
  dateTo: commonValidations.dateString.optional()
}).refine(
  data => !data.dateTo || !data.dateFrom || new Date(data.dateTo) >= new Date(data.dateFrom),
  {
    message: 'End date must be after start date',
    path: ['dateTo']
  }
)

// Request header schemas
export const CommonHeadersSchema = z.object({
  'content-type': z.string().optional(),
  'user-agent': z.string().optional(),
  'x-api-version': z.string().optional(),
  'x-request-id': z.string().uuid().optional()
}).passthrough()

// Response schemas for type safety
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  message: z.string(),
  timestamp: z.string().datetime(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string()
  })).optional()
})

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      pages: z.number().int().nonnegative(),
      hasNext: z.boolean(),
      hasPrev: z.boolean()
    })
  }),
  message: z.string(),
  timestamp: z.string().datetime()
})