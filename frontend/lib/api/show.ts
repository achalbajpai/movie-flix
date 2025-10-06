import { apiClient, ApiResponse } from './client'

export interface ShowSearchParams {
  movieId?: number
  theaterId?: number
  city?: string
  date?: string
  screenType?: string
}

export interface Show {
  show_id: number
  movie_id: number
  screen_id: number
  show_time: string
  end_time: string
  base_price: number
  show_type: string
  available_seats: number
  created_at: string
  updated_at: string
}

export interface ShowWithDetails extends Show {
  movie?: {
    movie_id: number
    title: string
    duration: number
    genre: string
    language: string
    rating: string | null
    poster_url: string | null
  }
  theater?: {
    theater_id: number
    name: string
    location: string
    city: string
  }
  screen?: {
    screen_id: number
    name: string
    screen_type: string
    total_seats: number
  }
}

export interface ShowSearchResult extends ShowWithDetails {
  occupancy_percentage?: number
}

export const showApi = {
  search: async (params: ShowSearchParams): Promise<ApiResponse<ShowSearchResult[]>> => {
    return apiClient.get('/shows/search', params)
  },

  getById: async (id: number): Promise<ApiResponse<ShowWithDetails>> => {
    return apiClient.get(`/shows/${id}`)
  },

  getByMovie: async (movieId: number, city?: string, date?: string): Promise<ApiResponse<ShowWithDetails[]>> => {
    const params: any = {}
    if (city) params.city = city
    if (date) params.date = date
    return apiClient.get(`/shows/movie/${movieId}`, params)
  },

  getByTheater: async (theaterId: number, date?: string): Promise<ApiResponse<ShowWithDetails[]>> => {
    return apiClient.get(`/shows/theater/${theaterId}`, date ? { date } : {})
  },

  getByScreen: async (screenId: number, date?: string): Promise<ApiResponse<ShowWithDetails[]>> => {
    return apiClient.get(`/shows/screen/${screenId}`, date ? { date } : {})
  },

  checkAvailability: async (showId: number): Promise<ApiResponse<{ showId: number; isAvailable: boolean }>> => {
    return apiClient.get(`/shows/${showId}/availability`)
  },

  getUpcoming: async (city?: string, hours: number = 24): Promise<ApiResponse<ShowWithDetails[]>> => {
    const params: any = { hours }
    if (city) params.city = city
    return apiClient.get('/shows/upcoming', params)
  }
}
