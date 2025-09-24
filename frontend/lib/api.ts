// Frontend API client for communicating with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

// API Response types
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
    limit: number
  }
}

// API Client class
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<T> = await response.json()
      return data
    } catch (error) {
      console.error('API Request failed:', { url, error })
      throw error
    }
  }

  // Bus API methods
  async searchBuses(params: BusSearchParams): Promise<ApiResponse<PaginatedResponse<Bus> & {
    metadata: SearchResultMetadata
    filters: SearchFilters
  }>> {
    const queryParams = new URLSearchParams()

    // Required parameters
    if (params.source) queryParams.append('source', params.source)
    if (params.destination) queryParams.append('destination', params.destination)
    if (params.departureDate) queryParams.append('departureDate', params.departureDate)
    if (params.passengers) queryParams.append('passengers', params.passengers.toString())

    // Optional parameters
    if (params.returnDate) queryParams.append('returnDate', params.returnDate)
    if (params.priceMin !== undefined) queryParams.append('priceMin', params.priceMin.toString())
    if (params.priceMax !== undefined) queryParams.append('priceMax', params.priceMax.toString())
    if (params.operators?.length) queryParams.append('operators', params.operators.join(','))
    if (params.busTypes?.length) queryParams.append('busTypes', params.busTypes.join(','))
    if (params.departureTimeStart) queryParams.append('departureTimeStart', params.departureTimeStart)
    if (params.departureTimeEnd) queryParams.append('departureTimeEnd', params.departureTimeEnd)
    if (params.amenities?.length) queryParams.append('amenities', params.amenities.join(','))
    if (params.rating !== undefined) queryParams.append('rating', params.rating.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())

    return this.request(`/api/${API_VERSION}/buses/search?${queryParams.toString()}`)
  }

  async getBusById(id: string): Promise<ApiResponse<Bus>> {
    return this.request(`/api/${API_VERSION}/buses/${id}`)
  }

  async getBusesByOperator(operatorId: string): Promise<ApiResponse<Bus[]>> {
    return this.request(`/api/${API_VERSION}/buses/operator/${operatorId}`)
  }

  async getBusStatistics(): Promise<ApiResponse<BusStatistics>> {
    return this.request(`/api/${API_VERSION}/buses/stats`)
  }

  // City API methods
  async getAllCities(): Promise<ApiResponse<City[]>> {
    return this.request(`/api/${API_VERSION}/cities`)
  }

  async searchCities(query: string, limit?: number): Promise<ApiResponse<City[]>> {
    const queryParams = new URLSearchParams()
    queryParams.append('q', query)
    if (limit !== undefined) queryParams.append('limit', limit.toString())

    return this.request(`/api/${API_VERSION}/cities/search?${queryParams.toString()}`)
  }

  async getPopularCities(): Promise<ApiResponse<City[]>> {
    return this.request(`/api/${API_VERSION}/cities/popular`)
  }

  async getCityById(id: string): Promise<ApiResponse<City>> {
    return this.request(`/api/${API_VERSION}/cities/${id}`)
  }

  // Operator API methods
  async getAllOperators(): Promise<ApiResponse<Operator[]>> {
    return this.request(`/api/${API_VERSION}/operators`)
  }

  async getOperatorById(id: string): Promise<ApiResponse<Operator>> {
    return this.request(`/api/${API_VERSION}/operators/${id}`)
  }

  async getTopOperators(limit?: number): Promise<ApiResponse<Operator[]>> {
    const queryParams = new URLSearchParams()
    if (limit !== undefined) queryParams.append('limit', limit.toString())

    return this.request(`/api/${API_VERSION}/operators/top?${queryParams.toString()}`)
  }

  // Health check methods
  async healthCheck(): Promise<ApiResponse<HealthStatus>> {
    return this.request('/health')
  }
}

// Type definitions for API
export interface BusSearchParams {
  source: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number

  // Filters
  priceMin?: number
  priceMax?: number
  operators?: string[]
  busTypes?: string[]
  departureTimeStart?: string
  departureTimeEnd?: string
  amenities?: string[]
  rating?: number

  // Sorting
  sortBy?: 'price' | 'duration' | 'rating' | 'departure' | 'arrival'
  sortOrder?: 'asc' | 'desc'

  // Pagination
  page?: number
  limit?: number
}

export interface Bus {
  id: string
  operatorId: string
  operatorName: string
  operatorRating: number
  routeId: string
  departureTime: string
  arrivalTime: string
  duration: number
  price: number
  availableSeats: number
  totalSeats: number
  busType: BusType
  amenities: Amenity[]
  images: string[]
}

export interface BusType {
  id: string
  name: string
  category: 'AC' | 'NON_AC'
  sleeper: boolean
  seatingArrangement: string
  description?: string
}

export interface Amenity {
  id: string
  name: string
  icon: string
  description?: string
}

export interface City {
  id: string
  name: string
  state: string
}

export interface Operator {
  id: string
  name: string
  rating: number
}

export interface SearchResultMetadata {
  totalCount: number
  searchTime: number
  appliedFilters: Record<string, any>
}

export interface SearchFilters {
  availableOperators: Array<{ id: string; name: string; busCount: number }>
  availableBusTypes: Array<{ id: string; name: string; busCount: number }>
  priceRange: { min: number; max: number }
  availableAmenities: Array<{ id: string; name: string; busCount: number }>
  departureTimeSlots: Array<{ slot: string; busCount: number }>
}

export interface BusStatistics {
  totalBuses: number
  operatorStats: Array<{ operatorId: string; busCount: number }>
}

export interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
  environment: string
  version: string
}

// Create singleton instance
const apiClient = new ApiClient()

// Export individual methods for easier use
export const busApi = {
  search: (params: BusSearchParams) => apiClient.searchBuses(params),
  getById: (id: string) => apiClient.getBusById(id),
  getByOperator: (operatorId: string) => apiClient.getBusesByOperator(operatorId),
  getStatistics: () => apiClient.getBusStatistics()
}

export const cityApi = {
  getAll: () => apiClient.getAllCities(),
  search: (query: string, limit?: number) => apiClient.searchCities(query, limit),
  getPopular: () => apiClient.getPopularCities(),
  getById: (id: string) => apiClient.getCityById(id)
}

export const operatorApi = {
  getAll: () => apiClient.getAllOperators(),
  getById: (id: string) => apiClient.getOperatorById(id),
  getTop: (limit?: number) => apiClient.getTopOperators(limit)
}

export const healthApi = {
  check: () => apiClient.healthCheck()
}

export default apiClient