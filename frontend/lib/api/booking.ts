import { apiClient, ApiResponse, PaginatedResponse } from './client'

export interface CreateBookingRequest {
  userId: string
  showId: number
  seatIds: number[]
  customers: Array<{
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
  }>
  contactDetails: {
    email: string
    phone: string
  }
}

export interface BookingConfirmation {
  bookingId: number
  bookingReference: string
  totalAmount: number
  seats: Array<{
    seatNo: string
    passengerName: string
  }>
  show: {
    departure: string
    arrival: string
    route: string
  }
  paymentStatus: string
  ticketUrl?: string
}

export interface BookingDetails {
  booking_id: number
  user_id: string
  show_id: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded'
  price: number
  total_amt: number
  created_at: string
  updated_at: string
  customers: Array<{
    booking_s_id: string
    seat_id: number
    seat_no: string
    customer_name: string
    customer_age: number
    gender: string
    price: number
  }>
  show: {
    show_id: number
    departure: string
    arrival: string
    base_price: number
    bus: {
      bus_id: number
      bus_no: string
      bus_type: string
      total_seats: number
    }
    route: {
      route_id: number
      source_des: string
      drop_des: string
      distance: number
      approx_time: string
    }
    operator: {
      operator_id: number
      company: string
      verification: boolean
    }
  }
  contactDetails: {
    email: string
    phone: string
  }
}

export interface BookingQueryParams {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded'
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export interface BookingValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface BookingResponse {
  id: string
  booking_id?: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalAmount: number
  journeyDate?: string // Legacy field for compatibility
  showDate?: string
  createdAt: string
  bus?: {
    id: string
    operatorName: string
    route: string
    departureTime: string
    arrivalTime: string
    duration: number
    price: number
  }
  show?: {
    showId: number
    movieTitle: string
    theaterName: string
    screenName: string
    showTime: string
    showType: string
    basePrice: number
  }
  customers: Array<{
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
  }>
  passengers?: Array<{
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
  }>
  seats: Array<{
    seatId: number
    seatNo: string
    price: number
  }>
  contactDetails: {
    email: string
    phone: string
  }
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrevious: boolean
  limit: number
}

export const bookingApi = {
  create: (bookingData: CreateBookingRequest) => apiClient.createBooking(bookingData),
  getById: (id: number) => apiClient.getBookingById(id),
  getUserBookings: (userId: string, params?: BookingQueryParams) => apiClient.getUserBookings(userId, params),
  cancel: (bookingId: number, userId: string, reason?: string) => apiClient.cancelBooking(bookingId, userId, reason),
  getByReference: (reference: string) => apiClient.getBookingByReference(reference),
  canCancel: (bookingId: number, userId: string) => apiClient.canCancelBooking(bookingId, userId),
  generateTicket: (bookingId: number) => apiClient.generateTicket(bookingId),
  validate: (bookingData: CreateBookingRequest) => apiClient.validateBooking(bookingData)
}