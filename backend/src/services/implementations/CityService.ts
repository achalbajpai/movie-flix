import { ICityService } from '@/services/interfaces'
import { ICityRepository } from '@/repositories/interfaces'
import { CustomError } from '@/middleware'
import { logger } from '@/config'

export const createCityService = (cityRepository: ICityRepository): ICityService => {

  const getAllCities = async (): Promise<Array<{ id: string; name: string; state: string }>> => {
    try {
      logger.info('Fetching all cities')

      const cities = await cityRepository.findAll()

      // Apply business logic - sort cities by name
      const sortedCities = cities
        .map(city => ({
          id: city.id,
          name: city.name,
          state: city.state
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      logger.info('Cities fetched successfully', { count: sortedCities.length })

      return sortedCities
    } catch (error) {
      logger.error('Error fetching cities', { error: (error as Error).message })
      throw error
    }
  }

  const searchCities = async (query: string, limit = 10): Promise<Array<{ id: string; name: string; state: string }>> => {
    try {
      logger.info('Searching cities', { query, limit })

      if (!query.trim()) {
        throw new CustomError('Search query cannot be empty', 400)
      }

      if (query.length < 2) {
        throw new CustomError('Search query must be at least 2 characters long', 400)
      }

      const cities = await cityRepository.findByQuery(query, limit)

      // Apply business logic - prioritize exact matches
      const prioritizedCities = prioritizeExactMatches(cities, query)

      const result = prioritizedCities.map(city => ({
        id: city.id,
        name: city.name,
        state: city.state
      }))

      logger.info('City search completed', {
        query,
        found: result.length,
        limit
      })

      return result
    } catch (error) {
      logger.error('Error searching cities', { error: (error as Error).message, query })
      throw error
    }
  }

  const getCityById = async (id: string): Promise<{ id: string; name: string; state: string }> => {
    try {
      logger.info('Fetching city by ID', { cityId: id })

      const city = await cityRepository.findById(id)

      if (!city) {
        throw new CustomError(`City with ID ${id} not found`, 404)
      }

      const result = {
        id: city.id,
        name: city.name,
        state: city.state
      }

      logger.info('City fetched successfully', { cityId: id, cityName: city.name })

      return result
    } catch (error) {
      logger.error('Error fetching city by ID', { error: (error as Error).message, cityId: id })
      throw error
    }
  }

  const getPopularCities = async (limit = 8): Promise<Array<{ id: string; name: string; state: string }>> => {
    try {
      logger.info('Fetching popular cities', { limit })

      const popularCities = await cityRepository.findPopularCities(limit)

      const result = popularCities.map(city => ({
        id: city.id,
        name: city.name,
        state: city.state
      }))

      logger.info('Popular cities fetched successfully', { count: result.length })

      return result
    } catch (error) {
      logger.error('Error fetching popular cities', { error: (error as Error).message })
      throw error
    }
  }

  const prioritizeExactMatches = (
    cities: Array<{ id: string; name: string; state: string }>,
    query: string
  ): Array<{ id: string; name: string; state: string }> => {
    const lowerQuery = query.toLowerCase()

    // Sort cities by relevance:
    // 1. Exact name match
    // 2. Name starts with query
    // 3. Name contains query
    // 4. State starts with query
    // 5. State contains query
    return cities.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aState = a.state.toLowerCase()
      const bState = b.state.toLowerCase()

      // Exact name match
      if (aName === lowerQuery && bName !== lowerQuery) return -1
      if (bName === lowerQuery && aName !== lowerQuery) return 1

      // Name starts with query
      const aStartsName = aName.startsWith(lowerQuery)
      const bStartsName = bName.startsWith(lowerQuery)
      if (aStartsName && !bStartsName) return -1
      if (bStartsName && !aStartsName) return 1

      // Name contains query
      const aContainsName = aName.includes(lowerQuery)
      const bContainsName = bName.includes(lowerQuery)
      if (aContainsName && !bContainsName) return -1
      if (bContainsName && !aContainsName) return 1

      // State starts with query
      const aStartsState = aState.startsWith(lowerQuery)
      const bStartsState = bState.startsWith(lowerQuery)
      if (aStartsState && !bStartsState) return -1
      if (bStartsState && !aStartsState) return 1

      // Default alphabetical sort by name
      return aName.localeCompare(bName)
    })
  }

  return {
    getAllCities,
    searchCities,
    getCityById,
    getPopularCities
  }
}