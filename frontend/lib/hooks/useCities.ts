import { useState, useCallback, useEffect } from 'react'
import { theaterApi } from '../api'

export interface City {
  id: string
  name: string
  state?: string
}

interface UseCitiesState {
  cities: City[]
  loading: boolean
  error: string | null
}

interface UseCitiesReturn extends UseCitiesState {
  searchCities: (query: string, limit?: number) => Promise<void>
  getPopularCities: () => Promise<void>
  clearError: () => void
}

export const useCities = (): UseCitiesReturn => {
  const [state, setState] = useState<UseCitiesState>({
    cities: [],
    loading: false,
    error: null
  })

  const searchCities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, cities: [], error: null }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await theaterApi.search(query)

      if (response.success && response.data) {
        // Extract unique cities from theaters and convert to City objects
        const uniqueCityNames = [...new Set(response.data!.map(theater => theater.city))]
        const cityObjects: City[] = uniqueCityNames.map(cityName => ({
          id: cityName.toLowerCase().replace(/\s+/g, '-'),
          name: cityName,
          state: undefined
        }))
        setState(prev => ({
          ...prev,
          cities: cityObjects,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || 'Failed to search cities'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }))
    }
  }, [])

  const getPopularCities = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await theaterApi.getCities()

      if (response.success && response.data) {
        // Convert string array to City objects
        const cityObjects: City[] = response.data!.map(cityName => ({
          id: cityName.toLowerCase().replace(/\s+/g, '-'),
          name: cityName,
          state: undefined
        }))
        setState(prev => ({
          ...prev,
          cities: cityObjects,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || 'Failed to fetch cities'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Load popular cities on mount
  useEffect(() => {
    getPopularCities()
  }, [getPopularCities])

  return {
    ...state,
    searchCities,
    getPopularCities,
    clearError
  }
}