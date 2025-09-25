import { Request, Response } from 'express'
import { ICityService } from '@/services/interfaces'
import { ResponseBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { z } from 'zod'

// Request schemas
const SearchCitiesQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters long').optional(),
  query: z.string().min(2, 'Query must be at least 2 characters long').optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('10')
}).transform(data => ({
  query: data.q || data.query || '',
  limit: data.limit
}))

const GetCityParamsSchema = z.object({
  id: z.string().min(1, 'City ID is required')
})

export class CityController {
  constructor(private readonly cityService: ICityService) {}

  /**
   * Get all cities
   * GET /api/v1/cities
   */
  getAllCities = asyncHandler(async (req: Request, res: Response) => {
    const cities = await this.cityService.getAllCities()

    res.json(ResponseBuilder.success(cities, 'Cities retrieved successfully'))
  })

  /**
   * Search cities
   * GET /api/v1/cities/search?q=query&limit=10
   * or
   * GET /api/v1/cities/search?query=query&limit=10
   */
  searchCities = asyncHandler(async (req: Request, res: Response) => {
    const { query, limit } = SearchCitiesQuerySchema.parse(req.query)

    if (!query) {
      // If no query provided, return all cities with limit
      const allCities = await this.cityService.getAllCities()
      const limitedCities = allCities.slice(0, limit)
      return res.json(ResponseBuilder.success(limitedCities, 'Cities retrieved successfully'))
    }

    const cities = await this.cityService.searchCities(query, limit)

    return res.json(ResponseBuilder.success(cities, `Cities matching "${query}" retrieved successfully`))
  })

  /**
   * Get city by ID
   * GET /api/v1/cities/:id
   */
  getCityById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = GetCityParamsSchema.parse(req.params)

    const city = await this.cityService.getCityById(id)

    res.json(ResponseBuilder.success(city, 'City retrieved successfully'))
  })

  /**
   * Get popular cities (could be based on booking frequency, etc.)
   * GET /api/v1/cities/popular
   */
  getPopularCities = asyncHandler(async (req: Request, res: Response) => {
    // Get popular cities based on actual route frequency
    const popularCities = await this.cityService.getPopularCities()

    res.json(ResponseBuilder.success(popularCities, 'Popular cities retrieved successfully'))
  })
}