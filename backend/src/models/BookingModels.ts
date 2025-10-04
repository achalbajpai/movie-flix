import { z } from 'zod'

// Zod schemas for booking validation - Movie Booking System
export const CustomerDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  age: z.number().min(1, 'Age must be at least 1').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long').optional()
})

export const CreateBookingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  showId: z.number().int().positive('Invalid show ID'),
  seatIds: z.array(z.number().int().positive('Invalid seat ID')).min(1, 'At least one seat must be selected'),
  customers: z.array(CustomerDetailsSchema).min(1, 'At least one customer is required'),
  contactDetails: z.object({
    email: z.string().email('Invalid email format'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long')
  })
})

export const UpdateBookingSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed', 'refunded']).optional(),
  customers: z.array(CustomerDetailsSchema).optional(),
  contactDetails: z.object({
    email: z.string().email('Invalid email format'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long')
  }).optional()
})

export const BookingQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'refunded']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  page: z.number().int().min(1, 'Page must be at least 1').optional(),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional()
})

export const SeatReservationSchema = z.object({
  showId: z.number().int().positive('Invalid show ID'),
  seatIds: z.array(z.number().int().positive('Invalid seat ID')).min(1, 'At least one seat must be selected'),
  userId: z.string().min(1, 'User ID is required'),
  expiresAt: z.string().datetime().optional() // ISO datetime string
})

export const CancelBookingSchema = z.object({
  reason: z.string().max(500, 'Reason too long').optional(),
  refundAmount: z.number().min(0, 'Refund amount cannot be negative').optional()
})

// Type definitions derived from schemas
export type CustomerDetails = z.infer<typeof CustomerDetailsSchema>
export type CreateBookingRequest = z.infer<typeof CreateBookingSchema>
export type UpdateBookingRequest = z.infer<typeof UpdateBookingSchema>
export type BookingQuery = z.infer<typeof BookingQuerySchema>
export type SeatReservationRequest = z.infer<typeof SeatReservationSchema>
export type CancelBookingRequest = z.infer<typeof CancelBookingSchema>

// Extended types for API responses
export interface BookingResponse {
  booking_id: number
  user_id: string
  show_id: number
  status: BookingStatus
  price: number
  total_amt: number
  created_at: string
  updated_at: string
  customers: BookingSeatWithDetails[]
  show: ShowDetails
  contactDetails: {
    email: string
    phone: string
  }
}

export interface BookingSeatWithDetails {
  ticket_id: string
  seat_id: number
  seat_no: string
  row_number: string
  column_number: number
  customer_name: string
  customer_age: number
  gender: string
  customer_email?: string
  customer_phone?: string
  price: number
  seat_type: string // Regular, Premium, Recliner
}

export interface ShowDetails {
  show_id: number
  show_time: string
  end_time: string
  base_price: number
  show_type: string // Regular, IMAX, 3D, 4DX
  language: string | null
  movie: {
    movie_id: number
    title: string
    description: string | null
    duration: number
    genre: string
    rating: string | null
    poster_url: string | null
  }
  screen: {
    screen_id: number
    screen_name: string
    screen_type: string
    total_seats: number
  }
  theater: {
    theater_id: number
    name: string
    location: string
    city: string
    address: string | null
  }
}

export interface SeatDetails {
  seat_id: number
  show_id: number
  seat_no: string
  row_number: string
  column_number: number
  is_reserved: boolean
  price: number
  seat_type: string // Regular, Premium, Recliner
  reservation_expires_at?: string
}

export interface SeatLayout {
  totalSeats: number
  rows: number
  columns: number
  layout: SeatLayoutRow[]
  screenType: string
}

export interface SeatLayoutRow {
  rowLetter: string // A, B, C, etc.
  rowNumber: number
  seats: SeatDetails[]
  isAisle?: boolean
}

export interface SeatReservation {
  reservation_id: string
  show_id: number
  seat_ids: number[]
  user_id: string
  expires_at: string
  created_at: string
}

export interface BookingStatistics {
  totalBookings: number
  totalRevenue: number
  bookingsByStatus: Array<{ status: BookingStatus; count: number }>
  revenueByPeriod: Array<{ period: string; revenue: number }>
  popularMovies: Array<{ movie: string; bookings: number }>
  popularTheaters: Array<{ theater: string; bookings: number }>
}

export interface BookingHistory {
  bookings: BookingResponse[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
    limit: number
  }
}

// Enums
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REFUNDED = 'refunded'
}

export enum SeatStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  BOOKED = 'booked',
  BLOCKED = 'blocked'
}

// Business logic types
export interface CreateBookingData {
  userId: string
  showId: number
  seats: Array<{
    seatId: number
    customer: CustomerDetails
  }>
  contactDetails: {
    email: string
    phone: string
  }
  totalAmount: number
}

export interface BookingConfirmation {
  bookingId: number
  bookingReference: string
  totalAmount: number
  seats: Array<{
    seatNo: string
    rowNumber: string
    columnNumber: number
    customerName: string
    seatType: string
  }>
  show: {
    showTime: string
    endTime: string
    movieTitle: string
    theaterName: string
    screenName: string
    screenType: string
  }
  paymentStatus: string
  ticketUrl?: string
  qrCode?: string
}

// Domain entities for business logic
export class BookingEntity {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly showId: number,
    public readonly status: BookingStatus,
    public readonly totalAmount: number,
    public readonly customers: CustomerDetails[],
    public readonly seatNumbers: string[],
    public readonly createdAt: Date,
    public readonly contactDetails: { email: string; phone: string }
  ) {}

  public canCancel(): boolean {
    return this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING
  }

  public isRefundable(): boolean {
    // Movie tickets can be refunded up to 2 hours before show time
    return this.status === BookingStatus.CANCELLED &&
           this.createdAt > new Date(Date.now() - 2 * 60 * 60 * 1000)
  }

  public getBookingReference(): string {
    return `MV${this.id.toString().padStart(6, '0')}`
  }

  public getTotalTickets(): number {
    return this.customers.length
  }

  public getPricePerTicket(): number {
    return this.totalAmount / this.customers.length
  }
}
