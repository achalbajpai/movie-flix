import { z } from 'zod'

// Zod schemas for booking validation
export const PassengerDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  age: z.number().min(1, 'Age must be at least 1').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' })
})

export const CreateBookingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  scheduleId: z.number().int().positive('Invalid schedule ID'),
  seatIds: z.array(z.number().int().positive('Invalid seat ID')).min(1, 'At least one seat must be selected'),
  passengers: z.array(PassengerDetailsSchema).min(1, 'At least one passenger is required'),
  contactDetails: z.object({
    email: z.string().email('Invalid email format'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long')
  })
})

export const UpdateBookingSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed', 'refunded']).optional(),
  passengers: z.array(PassengerDetailsSchema).optional(),
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
  scheduleId: z.number().int().positive('Invalid schedule ID'),
  seatIds: z.array(z.number().int().positive('Invalid seat ID')).min(1, 'At least one seat must be selected'),
  userId: z.string().min(1, 'User ID is required'),
  expiresAt: z.string().datetime().optional() // ISO datetime string
})

export const CancelBookingSchema = z.object({
  reason: z.string().max(500, 'Reason too long').optional(),
  refundAmount: z.number().min(0, 'Refund amount cannot be negative').optional()
})

// Type definitions derived from schemas
export type PassengerDetails = z.infer<typeof PassengerDetailsSchema>
export type CreateBookingRequest = z.infer<typeof CreateBookingSchema>
export type UpdateBookingRequest = z.infer<typeof UpdateBookingSchema>
export type BookingQuery = z.infer<typeof BookingQuerySchema>
export type SeatReservationRequest = z.infer<typeof SeatReservationSchema>
export type CancelBookingRequest = z.infer<typeof CancelBookingSchema>

// Extended types for API responses
export interface BookingResponse {
  booking_id: number
  user_id: string
  schedule_id: number
  status: BookingStatus
  price: number
  total_amt: number
  created_at: string
  updated_at: string
  passengers: BookingSeatWithDetails[]
  schedule: ScheduleDetails
  contactDetails: {
    email: string
    phone: string
  }
}

export interface BookingSeatWithDetails {
  booking_s_id: string
  seat_id: number
  seat_no: string
  pass_name: string
  pass_age: number
  gender: string
  price: number
}

export interface ScheduleDetails {
  schedule_id: number
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

export interface SeatDetails {
  seat_id: number
  schedule_id: number
  seat_no: string
  is_reserved: boolean
  price: number
  reservation_expires_at?: string
}

export interface SeatLayout {
  totalSeats: number
  layout: SeatLayoutRow[]
  busType: string
}

export interface SeatLayoutRow {
  rowNumber: number
  leftSeats: SeatDetails[]
  rightSeats: SeatDetails[]
  isExit?: boolean
}

export interface SeatReservation {
  reservation_id: string
  schedule_id: number
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
  popularRoutes: Array<{ route: string; bookings: number }>
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
  scheduleId: number
  seats: Array<{
    seatId: number
    passenger: PassengerDetails
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
    passengerName: string
  }>
  schedule: {
    departure: string
    arrival: string
    route: string
  }
  paymentStatus: string
  ticketUrl?: string
}

// Domain entities for business logic
export class BookingEntity {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly scheduleId: number,
    public readonly status: BookingStatus,
    public readonly totalAmount: number,
    public readonly passengers: PassengerDetails[],
    public readonly seatNumbers: string[],
    public readonly createdAt: Date,
    public readonly contactDetails: { email: string; phone: string }
  ) {}

  public canCancel(): boolean {
    return this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING
  }

  public isRefundable(): boolean {
    return this.status === BookingStatus.CANCELLED && this.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
  }

  public getBookingReference(): string {
    return `BK${this.id.toString().padStart(6, '0')}`
  }

  public getTotalPassengers(): number {
    return this.passengers.length
  }
}