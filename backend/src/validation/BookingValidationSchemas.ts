import { z } from 'zod'
import {
  CreateBookingSchema,
  UpdateBookingSchema,
  BookingQuerySchema,
  SeatReservationSchema,
  CancelBookingSchema,
  BookingStatus
} from '@/models'

// Parameter validation schemas
export const BookingIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid booking ID').transform(Number)
})

export const UserIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

export const BookingReferenceParamSchema = z.object({
  reference: z.string().regex(/^BK\d{6}$/, 'Invalid booking reference format')
})

export const BookingStatusParamSchema = z.object({
  status: z.nativeEnum(BookingStatus)
})

export const ScheduleIdParamSchema = z.object({
  scheduleId: z.string().regex(/^\d+$/, 'Invalid schedule ID').transform(Number)
})

export const DateRangeQuerySchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
})

// Body validation schemas
export const BookingStatusUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus)
})

export const ExtensionMinutesSchema = z.object({
  additionalMinutes: z.number().int().min(1, 'Must extend by at least 1 minute').max(30, 'Cannot extend by more than 30 minutes')
})

// Seat-related validation schemas
export const SeatIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid seat ID').transform(Number)
})

export const SeatNumberParamSchema = z.object({
  seatNumber: z.string().min(1, 'Seat number is required')
})

export const ReservationIdParamSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required')
})

export const SeatIdsSchema = z.object({
  seatIds: z.array(z.number().int().positive('Invalid seat ID')).min(1, 'At least one seat ID is required')
})

export const SeatStatusSchema = z.object({
  status: z.enum(['available', 'reserved', 'booked', 'blocked'])
})

// Combined validation exports
export const bookingValidationSchemas = {
  // Parameter validations
  bookingId: BookingIdParamSchema,
  userId: UserIdParamSchema,
  scheduleId: ScheduleIdParamSchema,
  bookingReference: BookingReferenceParamSchema,
  bookingStatusParam: BookingStatusParamSchema,
  seatId: SeatIdParamSchema,
  seatNumber: SeatNumberParamSchema,
  reservationId: ReservationIdParamSchema,

  // Query validations
  bookingQuery: BookingQuerySchema,
  dateRange: DateRangeQuerySchema,

  // Body validations
  createBooking: CreateBookingSchema,
  updateBooking: UpdateBookingSchema,
  cancelBooking: CancelBookingSchema,
  bookingStatus: BookingStatusUpdateSchema,
  seatReservation: SeatReservationSchema,
  seatIds: SeatIdsSchema,
  seatStatus: SeatStatusSchema,
  extensionMinutes: ExtensionMinutesSchema
}