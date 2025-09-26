import { apiClient, ApiResponse, PaginatedResponse } from './client'

export interface BusSearchParams {
  source: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  busType?: string
  sortBy?: 'price' | 'rating' | 'duration' | 'departure'
  sortOrder?: 'asc' | 'desc'
  filters?: BusSearchFilters
  page?: number
  limit?: number
  priceMin?: number
  priceMax?: number
  operators?: string[]
  busTypes?: string[]
  departureTimeStart?: string
  departureTimeEnd?: string
}

export interface Bus {
  id: string
  name: string
  operatorName: string
  route: string
  departureTime: string
  arrivalTime: string
  duration: number
  price: number
  availableSeats: number
  totalSeats: number
  rating: number
  operatorRating: number
  amenities: Amenity[]
  busType: BusType
}

export interface BusType {
  id: string
  name: string
  description: string
  category?: string
}

export interface Amenity {
  id: string
  name: string
  icon?: string
}

export interface SearchResultMetadata {
  totalResults: number
  searchTime: number
  filters: SearchFilters
}

export interface SearchFilters {
  priceRange: { min: number; max: number }
  departureTime: string[]
  busTypes: string[]
  operators: string[]
  ratings: number[]
  availableOperators?: Array<{ name: string }>
  availableBusTypes?: Array<{ name: string }>
}

export interface BusSearchFilters {
  priceRange?: { min: number; max: number }
  departureTimeSlots?: string[]
  busTypes?: string[]
  operators?: string[]
  minRating?: number
  amenities?: string[]
}

export interface BusStatistics {
  totalBuses: number
  averagePrice: number
  popularRoutes: string[]
}

export const busApi = {
  search: (params: BusSearchParams) => apiClient.searchBuses(params),
  getById: (id: string) => apiClient.getBusById(id),
  getByScheduleId: (scheduleId: string) => apiClient.getBusByScheduleId(scheduleId),
  getAvailableSeats: (scheduleId: string) => apiClient.getAvailableSeats(scheduleId)
}