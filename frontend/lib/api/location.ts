import { apiClient, ApiResponse } from './client'

export interface City {
  id: string
  name: string
  state?: string
  country?: string
}

export interface Operator {
  id: string
  name: string
  rating?: number
  totalBuses?: number
}

// These APIs are for bus operators and cities - not used in movie booking system
export const cityApi = {
  getAll: async (query?: string): Promise<ApiResponse<City[]>> => {
    return { success: true, data: [], timestamp: new Date().toISOString() }
  },
  getPopular: async (): Promise<ApiResponse<City[]>> => {
    return { success: true, data: [], timestamp: new Date().toISOString() }
  },
  getById: async (id: string): Promise<ApiResponse<City | null>> => {
    return { success: true, data: null, timestamp: new Date().toISOString() }
  },
  search: async (query?: string, limit?: number): Promise<ApiResponse<City[]>> => {
    return { success: true, data: [], timestamp: new Date().toISOString() }
  }
}

export const operatorApi = {
  getAll: async (): Promise<ApiResponse<Operator[]>> => {
    return { success: true, data: [], timestamp: new Date().toISOString() }
  },
  getById: async (id: string): Promise<ApiResponse<Operator | null>> => {
    return { success: true, data: null, timestamp: new Date().toISOString() }
  },
  getTop: async (limit?: number): Promise<ApiResponse<Operator[]>> => {
    return { success: true, data: [], timestamp: new Date().toISOString() }
  }
}