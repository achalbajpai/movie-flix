import { Request, Response } from 'express'
import { IBusService } from '@/services/interfaces'
import { ResponseBuilder, ApiErrorBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { SearchParamsSchema, FilterParamsSchema, SortOptionSchema, PaginationParamsSchema } from '@/models'
import { z } from 'zod'

// Request/Response schemas
const SearchBusesQuerySchema = z.object({
  source: SearchParamsSchema.shape.source,
  destination: SearchParamsSchema.shape.destination,
  departureDate: SearchParamsSchema.shape.departureDate,
  returnDate: SearchParamsSchema.shape.returnDate.optional(),
  passengers: z.string().transform(Number).pipe(SearchParamsSchema.shape.passengers),

  // Filters
  priceMin: z.string().transform(Number).optional(),
  priceMax: z.string().transform(Number).optional(),
  operators: z.string().optional().transform(str => str ? str.split(',') : undefined),
  busTypes: z.string().optional().transform(str => str ? str.split(',') : undefined),
  departureTimeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  departureTimeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  amenities: z.string().optional().transform(str => str ? str.split(',') : undefined),
  rating: z.string().transform(Number).pipe(z.number().min(0).max(5)).optional(),

  // Sorting
  sortBy: z.enum(['price', 'duration', 'rating', 'departure', 'arrival']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),

  // Pagination
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20')
})

const GetBusParamsSchema = z.object({
  id: z.string().min(1, 'Bus ID is required')
})

export class BusController {
  constructor(private readonly busService: IBusService) {}

  /**
   * Search buses based on criteria
   * GET /api/v1/buses/search
   */
  searchBuses = asyncHandler(async (req: Request, res: Response) => {
    // Validate and parse query parameters
    const validatedQuery = SearchBusesQuerySchema.parse(req.query)

    // Transform to service format
    const searchQuery = {
      searchParams: {
        source: validatedQuery.source,
        destination: validatedQuery.destination,
        departureDate: validatedQuery.departureDate,
        returnDate: validatedQuery.returnDate,
        passengers: validatedQuery.passengers
      },
      filters: this.buildFilterParams(validatedQuery),
      sort: this.buildSortOption(validatedQuery),
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit
      }
    }

    // Execute search
    const result = await this.busService.searchBuses(searchQuery)

    // Build paginated response
    const response = ResponseBuilder.paginated(
      result.buses,
      searchQuery.pagination.page,
      searchQuery.pagination.limit,
      result.metadata.totalCount,
      'Buses retrieved successfully'
    )

    // Add metadata and filters to response
    const enhancedResponse = {
      ...response,
      data: {
        ...response.data,
        metadata: result.metadata,
        filters: result.filters
      }
    }

    res.json(enhancedResponse)
  })

  /**
   * Get bus by ID
   * GET /api/v1/buses/:id
   */
  getBusById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = GetBusParamsSchema.parse(req.params)

    const bus = await this.busService.getBusById(id)

    res.json(ResponseBuilder.success(bus, 'Bus retrieved successfully'))
  })

  /**
   * Get buses by operator
   * GET /api/v1/buses/operator/:operatorId
   */
  getBusesByOperator = asyncHandler(async (req: Request, res: Response) => {
    const { operatorId } = z.object({
      operatorId: z.string().min(1, 'Operator ID is required')
    }).parse(req.params)

    const buses = await this.busService.getBusesByOperator(operatorId)

    res.json(ResponseBuilder.success(buses, 'Buses retrieved successfully'))
  })

  /**
   * Get buses by route
   * GET /api/v1/buses/route/:routeId
   */
  getBusesByRoute = asyncHandler(async (req: Request, res: Response) => {
    const { routeId } = z.object({
      routeId: z.string().min(1, 'Route ID is required')
    }).parse(req.params)

    const buses = await this.busService.getBusesByRoute(routeId)

    res.json(ResponseBuilder.success(buses, 'Buses retrieved successfully'))
  })

  /**
   * Get bus statistics
   * GET /api/v1/buses/stats
   */
  getBusStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.busService.getBusStatistics()

    res.json(ResponseBuilder.success(stats, 'Bus statistics retrieved successfully'))
  })

  private buildFilterParams(query: z.infer<typeof SearchBusesQuerySchema>) {
    const filters: any = {}

    // Price range
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      filters.priceRange = {
        min: query.priceMin || 0,
        max: query.priceMax || 999999
      }
    }

    // Operators
    if (query.operators) {
      filters.operators = query.operators
    }

    // Bus types
    if (query.busTypes) {
      filters.busTypes = query.busTypes
    }

    // Departure time range
    if (query.departureTimeStart || query.departureTimeEnd) {
      filters.departureTimeRange = {
        start: query.departureTimeStart || '00:00',
        end: query.departureTimeEnd || '23:59'
      }
    }

    // Amenities
    if (query.amenities) {
      filters.amenities = query.amenities
    }

    // Rating
    if (query.rating !== undefined) {
      filters.rating = query.rating
    }

    return Object.keys(filters).length > 0 ? filters : undefined
  }

  private buildSortOption(query: z.infer<typeof SearchBusesQuerySchema>) {
    if (query.sortBy) {
      return {
        field: query.sortBy,
        order: query.sortOrder || 'asc'
      }
    }
    return undefined
  }
}