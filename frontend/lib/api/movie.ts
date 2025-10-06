import { apiClient, ApiResponse } from './client'
import type { Theater } from './theater'
import type { Show } from './show'

export interface MovieSearchParams {
  city?: string
  date?: string
  movieId?: number
  genre?: string
  language?: string
}

export interface Movie {
  movie_id: number
  title: string
  duration: number // in minutes
  genre: string
  language: string
  rating: string | null
  actors: string[] | null
  description: string | null
  release_date: string | null
  poster_url: string | null
  trailer_url: string | null
  created_at: string
  updated_at: string
}

export interface MovieWithDetails extends Movie {
  theaters?: Theater[]
  shows?: Show[]
}

export interface MovieSearchResult {
  movie_id: number
  title: string
  genre: string
  language: string
  rating: string | null
  poster_url: string | null
  total_shows?: number
  cities?: string[]
}

export const movieApi = {
  search: async (params: MovieSearchParams): Promise<ApiResponse<MovieSearchResult[]>> => {
    return apiClient.get('/movies', params)
  },

  getById: async (id: number): Promise<ApiResponse<MovieWithDetails>> => {
    return apiClient.get(`/movies/${id}`)
  },

  getNowShowing: async (city?: string): Promise<ApiResponse<Movie[]>> => {
    return apiClient.get('/movies/now-showing', city ? { city } : {})
  },

  getUpcoming: async (city?: string): Promise<ApiResponse<Movie[]>> => {
    return apiClient.get('/movies/upcoming', city ? { city } : {})
  },

  getGenres: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/movies/genres')
  },

  getLanguages: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/movies/languages')
  }
}
