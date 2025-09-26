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

export const cityApi = {
  getAll: (query?: string) => apiClient.getCities(query),
  getPopular: () => apiClient.getPopularCities(),
  getById: (id: string) => apiClient.getCityById(id),
  search: (query?: string, limit?: number) => apiClient.getCities(query)
}

export const operatorApi = {
  getAll: () => apiClient.getOperators(),
  getById: (id: string) => apiClient.getOperatorById(id),
  getTop: (limit?: number) => apiClient.getTopOperators(limit)
}