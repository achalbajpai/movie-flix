import { apiClient, ApiResponse } from './client'

export interface Theater {
  theater_id: number
  user_id: string | null
  name: string
  location: string
  city: string
  verification: boolean
  contact_info: string | null
  amenities: string[] | null
  created_at: string
  updated_at: string
}

export interface TheaterWithScreens extends Theater {
  screens?: Screen[]
}

export interface Screen {
  screen_id: number
  theater_id: number
  name: string
  screen_type: string
  total_seats: number
  rows: number
  columns: number
  created_at: string
  updated_at: string
}

export const theaterApi = {
  getAll: async (): Promise<ApiResponse<Theater[]>> => {
    return apiClient.get('/theaters')
  },

  getById: async (id: number): Promise<ApiResponse<TheaterWithScreens>> => {
    return apiClient.get(`/theaters/${id}`)
  },

  getByCity: async (city: string): Promise<ApiResponse<Theater[]>> => {
    return apiClient.get(`/theaters/city/${city}`)
  },

  getByMovie: async (movieId: number, city?: string): Promise<ApiResponse<Theater[]>> => {
    return apiClient.get(`/theaters/movie/${movieId}`, city ? { city } : {})
  },

  getVerified: async (): Promise<ApiResponse<Theater[]>> => {
    return apiClient.get('/theaters/verified')
  },

  getCities: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/theaters/cities')
  },

  search: async (query: string): Promise<ApiResponse<Theater[]>> => {
    return apiClient.get('/theaters/search', { q: query })
  }
}
