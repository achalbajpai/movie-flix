import { useState, useEffect, useCallback } from 'react'
import { movieApi, type Movie } from '../api'

interface UseNowShowingState {
  movies: Movie[]
  loading: boolean
  error: string | null
}

interface UseNowShowingReturn extends UseNowShowingState {
  fetchNowShowing: (city?: string) => Promise<void>
  clearError: () => void
}

export const useNowShowing = (): UseNowShowingReturn => {
  const [state, setState] = useState<UseNowShowingState>({
    movies: [],
    loading: false,
    error: null
  })

  const fetchNowShowing = useCallback(async (city?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await movieApi.getNowShowing(city)

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          movies: response.data!,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || 'Failed to fetch movies'
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

  return {
    ...state,
    fetchNowShowing,
    clearError
  }
}
