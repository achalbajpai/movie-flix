import { logger } from '@/config'
import {
  ISeatService,
  ISeatRepository,
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus
} from '@/models'

export class SeatService implements ISeatService {

  constructor(
    private seatRepository: ISeatRepository
  ) {}

  async getSeatsBySchedule(scheduleId: number): Promise<SeatDetails[]> {
    try {
      return await this.seatRepository.findByScheduleId(scheduleId)
    } catch (error) {
      logger.error('Error getting seats by schedule', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getAvailableSeats(scheduleId: number): Promise<SeatDetails[]> {
    try {
      // Clean up expired reservations first
      await this.seatRepository.cleanupExpiredReservations()

      return await this.seatRepository.findAvailableSeats(scheduleId)
    } catch (error) {
      logger.error('Error getting available seats', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getSeatLayout(scheduleId: number): Promise<SeatLayout> {
    try {
      return await this.seatRepository.getSeatLayout(scheduleId)
    } catch (error) {
      logger.error('Error getting seat layout', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async checkSeatAvailability(scheduleId: number, seatIds: number[]): Promise<{
    available: boolean
    unavailableSeats: number[]
    conflictReason: string[]
  }> {
    try {
      // Clean up expired reservations first
      await this.seatRepository.cleanupExpiredReservations()

      const seats = await this.seatRepository.findSeatsByIds(seatIds)
      const unavailableSeats: number[] = []
      const conflictReason: string[] = []

      // Check if all requested seats exist and belong to the schedule
      if (seats.length !== seatIds.length) {
        const foundSeatIds = seats.map((s: any) => s.seat_id)
        const missingSeatIds = seatIds.filter(id => !foundSeatIds.includes(id))
        unavailableSeats.push(...missingSeatIds)
        conflictReason.push('Some seats do not exist')
      }

      // Check if seats belong to the correct schedule
      const wrongScheduleSeats = seats.filter(s => s.schedule_id !== scheduleId)
      if (wrongScheduleSeats.length > 0) {
        unavailableSeats.push(...wrongScheduleSeats.map(s => s.seat_id))
        conflictReason.push('Some seats do not belong to this schedule')
      }

      // Check if seats are available
      const reservedSeats = seats.filter(s => s.is_reserved)
      if (reservedSeats.length > 0) {
        // Check if reservations are expired
        const now = new Date()
        const stillReservedSeats = reservedSeats.filter(s => {
          if (!s.reservation_expires_at) return true
          return new Date(s.reservation_expires_at) > now
        })

        if (stillReservedSeats.length > 0) {
          unavailableSeats.push(...stillReservedSeats.map(s => s.seat_id))
          conflictReason.push('Some seats are already booked or reserved')
        }
      }

      return {
        available: unavailableSeats.length === 0,
        unavailableSeats: [...new Set(unavailableSeats)],
        conflictReason: [...new Set(conflictReason)]
      }

    } catch (error) {
      logger.error('Error checking seat availability', { error: (error as Error).message, scheduleId, seatIds })
      throw error
    }
  }

  async calculateSeatPrices(scheduleId: number, seatIds: number[]): Promise<{
    totalPrice: number
    seatPrices: Array<{ seatId: number; price: number; seatNo: string }>
  }> {
    try {
      const seats = await this.seatRepository.findSeatsByIds(seatIds)

      // Filter seats that belong to the correct schedule
      const validSeats = seats.filter(s => s.schedule_id === scheduleId)

      const seatPrices = validSeats.map(seat => ({
        seatId: seat.seat_id,
        price: seat.price,
        seatNo: seat.seat_no
      }))

      const totalPrice = seatPrices.reduce((sum: any, seat: any) => sum + seat.price, 0)

      return {
        totalPrice,
        seatPrices
      }

    } catch (error) {
      logger.error('Error calculating seat prices', { error: (error as Error).message, scheduleId, seatIds })
      throw error
    }
  }

  async validateSeatSelection(scheduleId: number, seatIds: number[]): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const errors: string[] = []
      const warnings: string[] = []

      // Check if any seats are selected
      if (seatIds.length === 0) {
        errors.push('At least one seat must be selected')
      }

      // Check maximum seat selection limit (e.g., 6 seats per booking)
      if (seatIds.length > 6) {
        errors.push('Cannot select more than 6 seats per booking')
      }

      // Check for duplicate seat IDs
      const uniqueSeatIds = new Set(seatIds)
      if (uniqueSeatIds.size !== seatIds.length) {
        errors.push('Duplicate seats selected')
      }

      // Check seat availability
      const availability = await this.checkSeatAvailability(scheduleId, seatIds)
      if (!availability.available) {
        errors.push(...availability.conflictReason)
      }

      // Get seat details for additional validations
      const seats = await this.seatRepository.findSeatsByIds(seatIds)
      const validSeats = seats.filter(s => s.schedule_id === scheduleId)

      // Check for mixed bus levels (if applicable) - warning only
      const seatNumbers = validSeats.map(s => s.seat_no)
      const hasUpperSeats = seatNumbers.some((sn: any) => sn.includes('U') || sn.toLowerCase().includes('upper'))
      const hasLowerSeats = seatNumbers.some((sn: any) => sn.includes('L') || sn.toLowerCase().includes('lower') ||
        (!sn.includes('U') && !sn.toLowerCase().includes('upper')))

      if (hasUpperSeats && hasLowerSeats) {
        warnings.push('Selected seats are on different levels of the bus')
      }

      // Check for widely separated seats - warning only
      if (validSeats.length > 1) {
        const rowNumbers = validSeats.map(s => {
          const match = s.seat_no.match(/^(\d+)/)
          return match ? parseInt(match[1]) : 0
        }).filter((rn: any) => rn > 0)

        if (rowNumbers.length > 1) {
          const minRow = Math.min(...rowNumbers)
          const maxRow = Math.max(...rowNumbers)
          if (maxRow - minRow > 3) {
            warnings.push('Selected seats are far apart from each other')
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      logger.error('Error validating seat selection', { error: (error as Error).message, scheduleId, seatIds })
      return {
        valid: false,
        errors: ['Failed to validate seat selection'],
        warnings: []
      }
    }
  }

  async createSeatReservation(reservationData: SeatReservationRequest): Promise<SeatReservation> {
    try {
      // Validate seat selection first
      const validation = await this.validateSeatSelection(reservationData.scheduleId, reservationData.seatIds)
      if (!validation.valid) {
        throw new Error(`Seat selection validation failed: ${validation.errors.join(', ')}`)
      }

      return await this.seatRepository.createReservation(reservationData)

    } catch (error) {
      logger.error('Error creating seat reservation', { error: (error as Error).message, reservationData })
      throw error
    }
  }

  async getSeatReservation(reservationId: string): Promise<SeatReservation | null> {
    try {
      return await this.seatRepository.findReservation(reservationId)
    } catch (error) {
      logger.error('Error getting seat reservation', { error: (error as Error).message, reservationId })
      throw error
    }
  }

  async getUserReservations(userId: string): Promise<SeatReservation[]> {
    try {
      return await this.seatRepository.findReservationsByUser(userId)
    } catch (error) {
      logger.error('Error getting user reservations', { error: (error as Error).message, userId })
      throw error
    }
  }

  async extendReservation(reservationId: string, additionalMinutes: number): Promise<SeatReservation> {
    try {
      const reservation = await this.seatRepository.findReservation(reservationId)
      if (!reservation) {
        throw new Error('Reservation not found')
      }

      const currentExpiry = new Date(reservation.expires_at)
      const newExpiry = new Date(currentExpiry.getTime() + additionalMinutes * 60 * 1000)

      // Don't allow extensions beyond 30 minutes total
      const createdAt = new Date(reservation.created_at)
      const maxExpiry = new Date(createdAt.getTime() + 30 * 60 * 1000)

      if (newExpiry > maxExpiry) {
        throw new Error('Cannot extend reservation beyond 30 minutes total')
      }

      return await this.seatRepository.extendReservation(reservationId, newExpiry.toISOString())

    } catch (error) {
      logger.error('Error extending reservation', { error: (error as Error).message, reservationId, additionalMinutes })
      throw error
    }
  }

  async cancelReservation(reservationId: string): Promise<void> {
    try {
      await this.seatRepository.cancelReservation(reservationId)
      logger.info('Seat reservation cancelled', { reservationId })
    } catch (error) {
      logger.error('Error cancelling reservation', { error: (error as Error).message, reservationId })
      throw error
    }
  }

  async getReservationTimeRemaining(reservationId: string): Promise<number> {
    try {
      const reservation = await this.seatRepository.findReservation(reservationId)
      if (!reservation) return 0

      const expiryTime = new Date(reservation.expires_at)
      const now = new Date()
      const remainingMs = expiryTime.getTime() - now.getTime()

      return Math.max(0, Math.floor(remainingMs / (60 * 1000))) // Return minutes

    } catch (error) {
      logger.error('Error getting reservation time remaining', { error: (error as Error).message, reservationId })
      return 0
    }
  }

  async markSeatsAsBooked(seatIds: number[], bookingId: number): Promise<void> {
    try {
      await this.seatRepository.markSeatsAsBooked(seatIds, bookingId)
      logger.info('Seats marked as booked', { seatIds, bookingId })
    } catch (error) {
      logger.error('Error marking seats as booked', { error: (error as Error).message, seatIds, bookingId })
      throw error
    }
  }

  async releaseSeats(seatIds: number[]): Promise<void> {
    try {
      await this.seatRepository.releaseSeats(seatIds)
      logger.info('Seats released', { seatIds })
    } catch (error) {
      logger.error('Error releasing seats', { error: (error as Error).message, seatIds })
      throw error
    }
  }

  async updateSeatStatus(seatId: number, status: SeatStatus): Promise<SeatDetails> {
    try {
      return await this.seatRepository.updateSeatStatus(seatId, status)
    } catch (error) {
      logger.error('Error updating seat status', { error: (error as Error).message, seatId, status })
      throw error
    }
  }

  async bulkUpdateSeatStatus(seatIds: number[], status: SeatStatus): Promise<SeatDetails[]> {
    try {
      return await this.seatRepository.updateMultipleSeatStatus(seatIds, status)
    } catch (error) {
      logger.error('Error bulk updating seat status', { error: (error as Error).message, seatIds, status })
      throw error
    }
  }

  async getSeatById(seatId: number): Promise<SeatDetails | null> {
    try {
      return await this.seatRepository.findSeatById(seatId)
    } catch (error) {
      logger.error('Error getting seat by ID', { error: (error as Error).message, seatId })
      throw error
    }
  }

  async getSeatsByIds(seatIds: number[]): Promise<SeatDetails[]> {
    try {
      return await this.seatRepository.findSeatsByIds(seatIds)
    } catch (error) {
      logger.error('Error getting seats by IDs', { error: (error as Error).message, seatIds })
      throw error
    }
  }

  async getSeatByNumber(scheduleId: number, seatNumber: string): Promise<SeatDetails | null> {
    try {
      return await this.seatRepository.findSeatByNumber(scheduleId, seatNumber)
    } catch (error) {
      logger.error('Error getting seat by number', { error: (error as Error).message, scheduleId, seatNumber })
      throw error
    }
  }

  async getBookedSeatsBySchedule(scheduleId: number): Promise<SeatDetails[]> {
    try {
      return await this.seatRepository.findBookedSeatsBySchedule(scheduleId)
    } catch (error) {
      logger.error('Error getting booked seats by schedule', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getSeatsByBooking(bookingId: number): Promise<SeatDetails[]> {
    try {
      return await this.seatRepository.findSeatsByBookingId(bookingId)
    } catch (error) {
      logger.error('Error getting seats by booking', { error: (error as Error).message, bookingId })
      throw error
    }
  }

  async getSeatOccupancyRate(scheduleId: number): Promise<number> {
    try {
      return await this.seatRepository.getSeatOccupancyRate(scheduleId)
    } catch (error) {
      logger.error('Error getting seat occupancy rate', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getPopularSeats(scheduleId: number): Promise<Array<{ seatNo: string; bookingCount: number }>> {
    try {
      return await this.seatRepository.getPopularSeats(scheduleId)
    } catch (error) {
      logger.error('Error getting popular seats', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getSeatRevenue(scheduleId: number): Promise<number> {
    try {
      const bookedSeats = await this.seatRepository.findBookedSeatsBySchedule(scheduleId)
      return bookedSeats.reduce((total, seat) => total + seat.price, 0)
    } catch (error) {
      logger.error('Error getting seat revenue', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async cleanupExpiredReservations(): Promise<{ cleanedCount: number; message: string }> {
    try {
      // Get expired reservations count before cleanup
      const userReservations = await this.seatRepository.findReservationsByUser('')
      const now = new Date()
      const expiredCount = userReservations.filter((r: any) => new Date(r.expires_at) < now).length

      await this.seatRepository.cleanupExpiredReservations()

      const message = `Cleaned up ${expiredCount} expired reservations`
      logger.info(message)

      return {
        cleanedCount: expiredCount,
        message
      }

    } catch (error) {
      logger.error('Error cleaning up expired reservations', { error: (error as Error).message })
      throw error
    }
  }

  async validateSeatLayout(scheduleId: number): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const issues: string[] = []

      // Get all seats for the schedule
      const seats = await this.seatRepository.findByScheduleId(scheduleId)

      if (seats.length === 0) {
        issues.push('No seats found for this schedule')
      }

      // Check for duplicate seat numbers
      const seatNumbers = seats.map(s => s.seat_no)
      const uniqueSeatNumbers = new Set(seatNumbers)
      if (uniqueSeatNumbers.size !== seatNumbers.length) {
        issues.push('Duplicate seat numbers found')
      }

      // Check for invalid seat numbers
      const invalidSeats = seats.filter(s => !s.seat_no || s.seat_no.trim().length === 0)
      if (invalidSeats.length > 0) {
        issues.push('Empty or invalid seat numbers found')
      }

      // Check for invalid prices
      const invalidPrices = seats.filter(s => s.price <= 0)
      if (invalidPrices.length > 0) {
        issues.push('Seats with invalid prices found')
      }

      return {
        valid: issues.length === 0,
        issues
      }

    } catch (error) {
      logger.error('Error validating seat layout', { error: (error as Error).message, scheduleId })
      return {
        valid: false,
        issues: ['Failed to validate seat layout']
      }
    }
  }

  // Real-time seat updates - simplified implementations
  // In a real implementation, these would integrate with WebSocket/SSE
  subscribeSeatUpdates(scheduleId: number, callback: (updates: SeatDetails[]) => void): void {
    logger.info('Subscribed to seat updates', { scheduleId })
    // Implementation would set up real-time listeners
  }

  unsubscribeSeatUpdates(scheduleId: number): void {
    logger.info('Unsubscribed from seat updates', { scheduleId })
    // Implementation would clean up real-time listeners
  }

  async broadcastSeatUpdate(scheduleId: number, seatIds: number[]): Promise<void> {
    try {
      const updatedSeats = await this.seatRepository.findSeatsByIds(seatIds)
      logger.info('Broadcasting seat updates', { scheduleId, seatCount: updatedSeats.length })
      // Implementation would broadcast updates to subscribed clients
    } catch (error) {
      logger.error('Error broadcasting seat update', { error: (error as Error).message, scheduleId, seatIds })
    }
  }
}