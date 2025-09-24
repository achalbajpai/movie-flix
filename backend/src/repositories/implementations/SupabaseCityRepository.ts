import { supabase } from '@/config'
import { ICityRepository } from '../interfaces/ICityRepository'
import { City } from '@/models'
import { logger } from '@/config'

export class SupabaseCityRepository implements ICityRepository {
  private cityCache: Map<string, City> = new Map()
  private cacheExpiry: Date | null = null
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  private async getUniqueCities(): Promise<City[]> {
    // Check cache first
    if (this.cacheExpiry && new Date() < this.cacheExpiry && this.cityCache.size > 0) {
      return Array.from(this.cityCache.values())
    }

    try {
      // Get unique cities from Routes table (source and destination)
      const { data: routes, error } = await supabase
        .from('Routes')
        .select('source_des, drop_des')

      if (error) {
        logger.error('Failed to fetch routes for city extraction', { error: error.message })
        throw new Error(`Database error: ${error.message}`)
      }

      if (!routes) {
        return []
      }

      // Extract unique city names
      const cityNames = new Set<string>()
      routes.forEach(route => {
        if (route.source_des) cityNames.add(route.source_des)
        if (route.drop_des) cityNames.add(route.drop_des)
      })

      // Create City objects with mock state data (since we don't have state info in routes)
      const cities: City[] = Array.from(cityNames).map(name => ({
        id: this.generateCityId(name),
        name,
        state: this.inferStateFromCityName(name), // Mock state inference
        country: 'India', // Default to India for bus booking system
        latitude: 0, // Could be populated from a geocoding service
        longitude: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      // Update cache
      this.cityCache.clear()
      cities.forEach(city => this.cityCache.set(city.id, city))
      this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION)

      logger.info('Cities extracted from routes', { count: cities.length })
      return cities
    } catch (error) {
      logger.error('Error extracting cities from routes', { error: (error as Error).message })
      throw error
    }
  }

  private generateCityId(cityName: string): string {
    // Generate consistent ID from city name
    return cityName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  private inferStateFromCityName(cityName: string): string {
    // Simple mapping of major cities to states
    const cityStateMap: Record<string, string> = {
      'mumbai': 'Maharashtra',
      'delhi': 'Delhi',
      'bangalore': 'Karnataka',
      'bengaluru': 'Karnataka',
      'chennai': 'Tamil Nadu',
      'kolkata': 'West Bengal',
      'hyderabad': 'Telangana',
      'pune': 'Maharashtra',
      'ahmedabad': 'Gujarat',
      'surat': 'Gujarat',
      'jaipur': 'Rajasthan',
      'lucknow': 'Uttar Pradesh',
      'kanpur': 'Uttar Pradesh',
      'nagpur': 'Maharashtra',
      'visakhapatnam': 'Andhra Pradesh',
      'bhopal': 'Madhya Pradesh',
      'patna': 'Bihar',
      'ludhiana': 'Punjab',
      'agra': 'Uttar Pradesh',
      'nashik': 'Maharashtra',
      'vadodara': 'Gujarat',
      'goa': 'Goa',
      'panaji': 'Goa'
    }

    const key = cityName.toLowerCase()
    return cityStateMap[key] || 'Unknown' // Default state for unmapped cities
  }

  async findAll(): Promise<City[]> {
    return this.getUniqueCities()
  }

  async findByQuery(query: string, limit = 10): Promise<City[]> {
    const allCities = await this.getUniqueCities()
    const lowerQuery = query.toLowerCase()

    const filtered = allCities.filter(city =>
      city.name.toLowerCase().includes(lowerQuery) ||
      city.state.toLowerCase().includes(lowerQuery)
    )

    // Sort by relevance (exact match first, then starts with, then contains)
    filtered.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()

      // Exact match
      if (aName === lowerQuery && bName !== lowerQuery) return -1
      if (bName === lowerQuery && aName !== lowerQuery) return 1

      // Starts with query
      if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1
      if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1

      // Alphabetical order for the rest
      return aName.localeCompare(bName)
    })

    return filtered.slice(0, limit)
  }

  async findById(id: string): Promise<City | null> {
    const allCities = await this.getUniqueCities()
    return allCities.find(city => city.id === id) || null
  }

  async findByIds(ids: string[]): Promise<City[]> {
    const allCities = await this.getUniqueCities()
    return allCities.filter(city => ids.includes(city.id))
  }
}