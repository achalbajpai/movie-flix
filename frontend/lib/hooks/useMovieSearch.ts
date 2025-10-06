import { useState, useCallback } from 'react'
import { movieApi, type MovieSearchParams, type MovieSearchResult } from '../api'

interface UseMovieSearchState {
  movies: MovieSearchResult[]
  loading: boolean
  error: string | null
}

interface UseMovieSearchReturn extends UseMovieSearchState {
  searchMovies: (params: MovieSearchParams) => Promise<void>
  clearResults: () => void
  clearError: () => void
}

export const useMovieSearch = (): UseMovieSearchReturn => {
  const [state, setState] = useState<UseMovieSearchState>({
    movies: [],
    loading: false,
    error: null
  })

  const searchMovies = useCallback(async (params: MovieSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await movieApi.search(params)

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
      movies: [],
      error: null
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    searchMovies,
    clearResults,
    clearError
  }
}
