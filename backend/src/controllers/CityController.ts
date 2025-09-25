import { Request, Response } from 'express'
import { ICityService } from '@/services/interfaces'
import { ResponseBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { validate } from '@/validation'

export const createCityController = (cityService: ICityService) => {
  /**
   * Get all cities
   * GET /api/v1/cities
   */
  const getAllCities = asyncHandler(async (req: Request, res: Response) => {
    const cities = await cityService.getAllCities()

    res.json(ResponseBuilder.success(cities, 'Cities retrieved successfully'))
  })

  /**
   * Search cities
   * GET /api/v1/cities/search?q=query&limit=10
   * or
   * GET /api/v1/cities/search?query=query&limit=10
   */
  const searchCities = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.citySearchQuery(req.query)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid city search parameters')
    }
    const { query, limit } = validationResult.data as any

    if (!query) {
      // If no query provided, return all cities with limit
      const allCities = await cityService.getAllCities()
      const limitedCities = allCities.slice(0, limit)
      return res.json(ResponseBuilder.success(limitedCities, 'Cities retrieved successfully'))
    }

    const cities = await cityService.searchCities(query, limit)

    return res.json(ResponseBuilder.success(cities, `Cities matching "${query}" retrieved successfully`))
  })

  /**
   * Get city by ID
   * GET /api/v1/cities/:id
   */
  const getCityById = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.cityId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid city ID parameter')
    }
    const { id } = validationResult.data as any

    const city = await cityService.getCityById(id)

    res.json(ResponseBuilder.success(city, 'City retrieved successfully'))
  })

  /**
   * Get popular cities (could be based on booking frequency, etc.)
   * GET /api/v1/cities/popular
   */
  const getPopularCities = asyncHandler(async (req: Request, res: Response) => {
    // Validate query parameters (optional limit)
    const validationResult = validate.popularCitiesQuery(req.query || {})
    const limit = validationResult.success && validationResult.data ? (validationResult.data as any).limit : 8

    // Get popular cities based on actual route frequency
    const popularCities = await cityService.getPopularCities(limit)

    res.json(ResponseBuilder.success(popularCities, 'Popular cities retrieved successfully'))
  })

  return {
    getAllCities,
    searchCities,
    getCityById,
    getPopularCities
  }
}