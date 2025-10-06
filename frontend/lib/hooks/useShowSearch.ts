import { useState, useCallback } from 'react'
import { showApi, type ShowSearchParams, type ShowSearchResult } from '../api'

interface UseShowSearchState {
  shows: ShowSearchResult[]
  loading: boolean
  error: string | null
}

interface UseShowSearchReturn extends UseShowSearchState {
  searchShows: (params: ShowSearchParams) => Promise<void>
  clearResults: () => void
  clearError: () => void
}

export const useShowSearch = (): UseShowSearchReturn => {
  const [state, setState] = useState<UseShowSearchState>({
    shows: [],
    loading: false,
    error: null
  })

  const searchShows = useCallback(async (params: ShowSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await showApi.search(params)

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          shows: response.data!,
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
      shows: [],
      error: null
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    searchShows,
    clearResults,
    clearError
  }
}
