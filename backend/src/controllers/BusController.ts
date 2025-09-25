import { Request, Response } from 'express'
import { IBusService } from '@/services/interfaces'
import { ResponseBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { validate } from '@/validation'

export const createBusController = (busService: IBusService) => {
  /**
   * Search buses based on criteria
   * GET /api/v1/buses/search
   */
  const searchBuses = asyncHandler(async (req: Request, res: Response) => {
    // Validate and parse query parameters using validation factory
    const validationResult = validate.busSearchQuery(req.query)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid query parameters')
    }
    const validatedQuery = validationResult.data as any

    // Transform to service format
    const searchQuery = {
      searchParams: {
        source: validatedQuery.source,
        destination: validatedQuery.destination,
        departureDate: validatedQuery.departureDate,
        returnDate: validatedQuery.returnDate,
        passengers: validatedQuery.passengers
      },
      filters: buildFilterParams(validatedQuery),
      sort: buildSortOption(validatedQuery),
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit
      }
    }

    // Execute search
    const result = await busService.searchBuses(searchQuery)

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
  const getBusById = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.busId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid bus ID parameter')
    }
    const { id } = validationResult.data as any

    const bus = await busService.getBusById(id)

    res.json(ResponseBuilder.success(bus, 'Bus retrieved successfully'))
  })

  /**
   * Get buses by operator
   * GET /api/v1/buses/operator/:operatorId
   */
  const getBusesByOperator = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.operatorId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid operator ID parameter')
    }
    const { operatorId } = validationResult.data as any

    const buses = await busService.getBusesByOperator(operatorId)

    res.json(ResponseBuilder.success(buses, 'Buses retrieved successfully'))
  })

  /**
   * Get buses by route
   * GET /api/v1/buses/route/:routeId
   */
  const getBusesByRoute = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.routeId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid route ID parameter')
    }
    const { routeId } = validationResult.data as any

    const buses = await busService.getBusesByRoute(routeId)

    res.json(ResponseBuilder.success(buses, 'Buses retrieved successfully'))
  })

  /**
   * Get bus statistics
   * GET /api/v1/buses/stats
   */
  const getBusStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await busService.getBusStatistics()

    res.json(ResponseBuilder.success(stats, 'Bus statistics retrieved successfully'))
  })

  const buildFilterParams = (query: any) => {
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

  const buildSortOption = (query: any) => {
    if (query.sortBy) {
      return {
        field: query.sortBy,
        order: query.sortOrder || 'asc'
      }
    }
    return undefined
  }

  return {
    searchBuses,
    getBusById,
    getBusesByOperator,
    getBusesByRoute,
    getBusStatistics
  }
}