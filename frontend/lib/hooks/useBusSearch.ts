import { useState, useCallback } from 'react'
import { busApi, type BusSearchParams, type Bus, type SearchResultMetadata, type SearchFilters } from '../api'

interface UseBusSearchState {
  buses: Bus[]
  metadata: SearchResultMetadata | null
  filters: SearchFilters | null
  loading: boolean
  error: string | null
}

interface UseBusSearchReturn extends UseBusSearchState {
  searchBuses: (params: BusSearchParams) => Promise<void>
  clearResults: () => void
  clearError: () => void
}

export const useBusSearch = (): UseBusSearchReturn => {
  const [state, setState] = useState<UseBusSearchState>({
    buses: [],
    metadata: null,
    filters: null,
    loading: false,
    error: null
  })

  const searchBuses = useCallback(async (params: BusSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await busApi.search(params)

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          buses: response.data!.data,
          metadata: response.data!.metadata,
          filters: response.data!.filters,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || 'Search failed'
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

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      buses: [],
      metadata: null,
      filters: null,
      error: null
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    searchBuses,
    clearResults,
    clearError
  }
}