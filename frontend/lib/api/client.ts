import { supabase } from '@/lib/supabase'

// Core API client and base types
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  metadata?: any
  filters?: any
}

export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }
    return {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const authHeaders = await this.getAuthHeaders()

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            details: errorData
          },
          timestamp: new Date().toISOString()
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString()
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
          details: error
        },
        timestamp: new Date().toISOString()
      }
    }
  }

  // Bus API methods
  async searchBuses(params: any): Promise<ApiResponse<PaginatedResponse<any>>> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString()

    return this.request(`/api/${API_VERSION}/buses/search?${queryString}`)
  }

  async getBusById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/${API_VERSION}/buses/${id}`)
  }

  async getBusByScheduleId(scheduleId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/${API_VERSION}/buses/schedule/${scheduleId}`)
  }

  async getAvailableSeats(scheduleId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/${API_VERSION}/buses/schedule/${scheduleId}/seats/available`)
  }

  // City API methods
  async getCities(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?search=${encodeURIComponent(query)}` : ''
    return this.request(`/api/${API_VERSION}/cities${params}`)
  }

  async getPopularCities(): Promise<ApiResponse<any[]>> {
    return this.request(`/api/${API_VERSION}/cities/popular`)
  }

  async getCityById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/${API_VERSION}/cities/${id}`)
  }

  // Operator API methods
  async getOperators(): Promise<ApiResponse<any[]>> {
    return this.request(`/api/${API_VERSION}/operators`)
  }

  async getOperatorById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/${API_VERSION}/operators/${id}`)
  }

  async getTopOperators(limit?: number): Promise<ApiResponse<any[]>> {
    const params = limit ? `?limit=${limit}` : ''
    return this.request(`/api/${API_VERSION}/operators/top${params}`)
  }

  // Health API methods
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health')
  }

  // Booking API methods
  async createBooking(bookingData: any): Promise<ApiResponse<any>> {
    return this.request('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  }

  async getBookingById(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/bookings/${id}`)
  }

  async getUserBookings(userId: string, params?: any): Promise<ApiResponse<PaginatedResponse<any> & { pagination: any }>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate)
    if (params?.toDate) queryParams.append('toDate', params.toDate)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return this.request(`/api/v1/bookings/user/${userId}${query ? `?${query}` : ''}`)
  }

  async cancelBooking(bookingId: number, userId: string, reason?: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    })
  }

  async getBookingByReference(reference: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/bookings/reference/${reference}`)
  }

  async canCancelBooking(bookingId: number, userId: string): Promise<ApiResponse<{ canCancel: boolean; refundAmount: number }>> {
    return this.request(`/api/v1/bookings/${bookingId}/can-cancel/${userId}`)
  }

  async generateTicket(bookingId: number): Promise<void> {
    const url = `${this.baseURL}/api/v1/bookings/${bookingId}/ticket`
    const authHeaders = await this.getAuthHeaders()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders,
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to generate ticket: ${response.statusText}`)
    }

    // Get the PDF blob
    const blob = await response.blob()

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `ticket-${bookingId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    window.URL.revokeObjectURL(downloadUrl)
  }

  async validateBooking(bookingData: any): Promise<ApiResponse<any>> {
    return this.request('/api/v1/bookings/validate', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  }

  // Seat API methods
  async getSeatLayout(scheduleId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/seats/schedule/${scheduleId}/layout`)
  }

  async getAvailableSeatsForSchedule(scheduleId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/api/v1/seats/schedule/${scheduleId}/available`)
  }

  async checkSeatAvailability(scheduleId: number, seatIds: number[]): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/seats/schedule/${scheduleId}/check-availability`, {
      method: 'POST',
      body: JSON.stringify({ seatIds })
    })
  }

  async calculateSeatPrices(scheduleId: number, seatIds: number[]): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/seats/schedule/${scheduleId}/calculate-prices`, {
      method: 'POST',
      body: JSON.stringify({ seatIds })
    })
  }

  async validateSeatSelection(scheduleId: number, seatIds: number[]): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/seats/schedule/${scheduleId}/validate-selection`, {
      method: 'POST',
      body: JSON.stringify({ seatIds })
    })
  }

  async createSeatReservation(reservationData: any): Promise<ApiResponse<any>> {
    return this.request('/api/v1/seats/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    })
  }

  async getSeatReservation(reservationId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/seats/reservations/${reservationId}`)
  }

  async extendReservation(reservationId: string, additionalMinutes: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/seats/reservations/${reservationId}/extend`, {
      method: 'PATCH',
      body: JSON.stringify({ additionalMinutes })
    })
  }

  async cancelReservation(reservationId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/seats/reservations/${reservationId}`, {
      method: 'DELETE'
    })
  }

  async getReservationTimeRemaining(reservationId: string): Promise<ApiResponse<{ timeRemaining: number }>> {
    return this.request(`/api/v1/seats/reservations/${reservationId}/time-remaining`)
  }
}

export const apiClient = new ApiClient()