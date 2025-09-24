import { useState, useCallback, useEffect } from 'react'
import { cityApi, type City } from '../api'

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

  const searchCities = useCallback(async (query: string, limit?: number) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, cities: [], error: null }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await cityApi.search(query, limit)

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          cities: response.data!,
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
      const response = await cityApi.getPopular()

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          cities: response.data!,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || 'Failed to fetch popular cities'
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