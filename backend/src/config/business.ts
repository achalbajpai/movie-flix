import { addMinutes, differenceInHours } from 'date-fns'

/**
 * Business Configuration
 * Centralized configuration for business rules and policies.
 * These values can be overridden via environment variables.
 */

export interface BusinessConfig {
  // Seat Reservation Settings
  seatReservationTimeoutMs: number
  seatReservationTimeoutMinutes: number

  // Pagination Settings
  defaultPageSize: number
  maxPageSize: number

  // Refund Policy Settings
  refundPolicyHours: number // Hours before show time when cancellation is allowed
  refundPercentageMap: {
    hoursBeforeShow: number
    refundPercentage: number
  }[]

  // Booking Settings
  maxSeatsPerBooking: number
  minAdvanceBookingMinutes: number
}

/**
 * Default business configuration values
 */
const defaultConfig: BusinessConfig = {
  // Seat reservations expire after 5 minutes
  seatReservationTimeoutMs: 5 * 60 * 1000,
  seatReservationTimeoutMinutes: 5,

  // Pagination defaults
  defaultPageSize: 10,
  maxPageSize: 100,

  // Refund policy: Can cancel up to 2 hours before show time
  refundPolicyHours: 2,
  refundPercentageMap: [
    { hoursBeforeShow: 24, refundPercentage: 100 }, // Full refund if cancelled 24h+ before
    { hoursBeforeShow: 12, refundPercentage: 75 },  // 75% refund if cancelled 12-24h before
    { hoursBeforeShow: 2, refundPercentage: 50 },   // 50% refund if cancelled 2-12h before
    { hoursBeforeShow: 0, refundPercentage: 0 }     // No refund if cancelled less than 2h before
  ],

  // Booking limits
  maxSeatsPerBooking: 10,
  minAdvanceBookingMinutes: 15 // Must book at least 15 minutes before show time
}

/**
 * Load business configuration with environment variable overrides
 */
function loadBusinessConfig(): BusinessConfig {
  const seatReservationMinutes = process.env.SEAT_RESERVATION_TIMEOUT_MINUTES
    ? parseInt(process.env.SEAT_RESERVATION_TIMEOUT_MINUTES, 10)
    : defaultConfig.seatReservationTimeoutMinutes

  return {
    seatReservationTimeoutMs: seatReservationMinutes * 60 * 1000,
    seatReservationTimeoutMinutes: seatReservationMinutes,

    defaultPageSize: process.env.DEFAULT_PAGE_SIZE
      ? parseInt(process.env.DEFAULT_PAGE_SIZE, 10)
      : defaultConfig.defaultPageSize,

    maxPageSize: process.env.MAX_PAGE_SIZE
      ? parseInt(process.env.MAX_PAGE_SIZE, 10)
      : defaultConfig.maxPageSize,

    refundPolicyHours: process.env.REFUND_POLICY_HOURS
      ? parseInt(process.env.REFUND_POLICY_HOURS, 10)
      : defaultConfig.refundPolicyHours,

    refundPercentageMap: defaultConfig.refundPercentageMap, // TODO: Make this configurable via JSON env var if needed

    maxSeatsPerBooking: process.env.MAX_SEATS_PER_BOOKING
      ? parseInt(process.env.MAX_SEATS_PER_BOOKING, 10)
      : defaultConfig.maxSeatsPerBooking,

    minAdvanceBookingMinutes: process.env.MIN_ADVANCE_BOOKING_MINUTES
      ? parseInt(process.env.MIN_ADVANCE_BOOKING_MINUTES, 10)
      : defaultConfig.minAdvanceBookingMinutes
  }
}

/**
 * Business configuration instance
 */
export const businessConfig = loadBusinessConfig()

/**
 * Helper function to calculate refund percentage based on hours before show
 */
export function calculateRefundPercentage(hoursBeforeShow: number): number {
  // Find the first policy that applies (policies are ordered from highest to lowest hours)
  const policy = businessConfig.refundPercentageMap.find(
    p => hoursBeforeShow >= p.hoursBeforeShow
  )

  return policy ? policy.refundPercentage : 0
}

/**
 * Helper function to check if a booking can be cancelled
 */
export function canCancelBooking(showTime: Date, currentTime: Date = new Date()): boolean {
  const hoursUntilShow = differenceInHours(showTime, currentTime)
  return hoursUntilShow >= businessConfig.refundPolicyHours
}

/**
 * Helper function to calculate refund amount
 */
export function calculateRefundAmount(
  totalAmount: number,
  showTime: Date,
  currentTime: Date = new Date()
): number {
  const hoursUntilShow = differenceInHours(showTime, currentTime)
  const refundPercentage = calculateRefundPercentage(hoursUntilShow)
  return Math.round((totalAmount * refundPercentage) / 100)
}

/**
 * Helper function to calculate seat reservation expiry time
 */
export function calculateSeatReservationExpiry(fromTime: Date = new Date()): Date {
  return addMinutes(fromTime, businessConfig.seatReservationTimeoutMinutes)
}
