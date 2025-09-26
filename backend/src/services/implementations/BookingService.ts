import { logger } from '@/config'
import {
  IBookingService,
  IBookingRepository,
  ISeatRepository,
  BookingResponse,
  BookingQuery,
  CreateBookingData,
  BookingStatistics,
  BookingHistory,
  CancelBookingRequest,
  BookingStatus,
  BookingConfirmation,
  SeatStatus
} from '@/models'

export class BookingService implements IBookingService {

  constructor(
    private bookingRepository: IBookingRepository,
    private seatRepository: ISeatRepository
  ) {}

  async createBooking(bookingData: CreateBookingData): Promise<BookingConfirmation> {
    try {
      // Validate booking request
      const validation = await this.validateBookingRequest(bookingData)
      if (!validation.valid) {
        throw new Error(`Booking validation failed: ${validation.errors.join(', ')}`)
      }

      // Check seat availability one more time
      const seatIds = bookingData.seats.map(s => s.seatId)
      const seatAvailability = await this.seatRepository.checkSeatAvailability(bookingData.scheduleId, seatIds)
      if (!seatAvailability) {
        throw new Error('Selected seats are no longer available')
      }

      // Calculate total amount
      const totalAmount = await this.seatRepository.calculateSeatPrices(bookingData.scheduleId, seatIds)
      const bookingDataWithAmount = { ...bookingData, totalAmount }

      // Create the booking
      const booking = await this.bookingRepository.create(bookingDataWithAmount)

      // Mark seats as booked
      await this.seatRepository.markSeatsAsBooked(seatIds, booking.booking_id)

      // Generate booking confirmation
      const confirmation: BookingConfirmation = {
        bookingId: booking.booking_id,
        bookingReference: this.generateBookingReference(booking.booking_id),
        totalAmount: booking.total_amt,
        seats: booking.passengers.map((p: any) => ({
          seatNo: p.seat_no,
          passengerName: p.pass_name
        })),
        schedule: {
          departure: booking.schedule.departure,
          arrival: booking.schedule.arrival,
          route: `${booking.schedule.route.source_des} to ${booking.schedule.route.drop_des}`
        },
        paymentStatus: 'confirmed' // In real implementation, this would come from payment gateway
      }

      // Send booking confirmation (async)
      this.sendBookingConfirmation(booking.booking_id).catch(error => {
        logger.warn('Failed to send booking confirmation', { error: error.message, bookingId: booking.booking_id })
      })

      logger.info('Booking created successfully', {
        bookingId: booking.booking_id,
        userId: bookingData.userId,
        scheduleId: bookingData.scheduleId,
        seatCount: seatIds.length
      })

      return confirmation

    } catch (error) {
      logger.error('Error creating booking', { error: (error as Error).message, bookingData })
      throw error
    }
  }

  async getBookingById(bookingId: number): Promise<BookingResponse | null> {
    try {
      return await this.bookingRepository.findById(bookingId)
    } catch (error) {
      logger.error('Error getting booking by ID', { error: (error as Error).message, bookingId })
      throw error
    }
  }

  async getUserBookings(userId: string, query?: Partial<BookingQuery>): Promise<BookingHistory> {
    try {
      return await this.bookingRepository.findByUserId(userId, query)
    } catch (error) {
      logger.error('Error getting user bookings', { error: (error as Error).message, userId, query })
      throw error
    }
  }

  async updateBookingStatus(bookingId: number, status: BookingStatus): Promise<BookingResponse> {
    try {
      const booking = await this.bookingRepository.updateStatus(bookingId, status)

      // If booking is cancelled, release the seats
      if (status === BookingStatus.CANCELLED) {
        const seats = await this.seatRepository.findSeatsByBookingId(bookingId)
        const seatIds = seats.map((seat: any) => seat.seat_id)
        await this.seatRepository.releaseSeats(seatIds)
      }

      logger.info('Booking status updated', { bookingId, status })
      return booking

    } catch (error) {
      logger.error('Error updating booking status', { error: (error as Error).message, bookingId, status })
      throw error
    }
  }

  async cancelBooking(bookingId: number, userId: string, cancelData?: CancelBookingRequest): Promise<BookingResponse> {
    try {
      // Check if user has access to cancel this booking
      const hasAccess = await this.checkBookingAccess(bookingId, userId)
      if (!hasAccess) {
        throw new Error('Unauthorized to cancel this booking')
      }

      // Check if booking can be cancelled
      const canCancel = await this.canCancelBooking(bookingId, userId)
      if (!canCancel) {
        throw new Error('Booking cannot be cancelled at this time')
      }

      // Cancel the booking
      const booking = await this.bookingRepository.cancel(bookingId, cancelData || {})

      // Send cancellation notification (async)
      this.sendCancellationNotification(bookingId).catch(error => {
        logger.warn('Failed to send cancellation notification', { error: error.message, bookingId })
      })

      logger.info('Booking cancelled successfully', { bookingId, userId })
      return booking

    } catch (error) {
      logger.error('Error cancelling booking', { error: (error as Error).message, bookingId, userId, cancelData })
      throw error
    }
  }

  async getAllBookings(query?: BookingQuery): Promise<BookingHistory> {
    try {
      return await this.bookingRepository.findAll(query)
    } catch (error) {
      logger.error('Error getting all bookings', { error: (error as Error).message, query })
      throw error
    }
  }

  async getBookingsBySchedule(scheduleId: number): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findByScheduleId(scheduleId)
    } catch (error) {
      logger.error('Error getting bookings by schedule', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getBookingsByDateRange(fromDate: string, toDate: string): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findByDateRange(fromDate, toDate)
    } catch (error) {
      logger.error('Error getting bookings by date range', { error: (error as Error).message, fromDate, toDate })
      throw error
    }
  }

  async getBookingsByStatus(status: BookingStatus): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findByStatus(status)
    } catch (error) {
      logger.error('Error getting bookings by status', { error: (error as Error).message, status })
      throw error
    }
  }

  async getUpcomingBookings(userId: string): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findUpcomingBookings(userId)
    } catch (error) {
      logger.error('Error getting upcoming bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  async getPastBookings(userId: string): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findPastBookings(userId)
    } catch (error) {
      logger.error('Error getting past bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  async getCancellableBookings(userId: string): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findCancellableBookings(userId)
    } catch (error) {
      logger.error('Error getting cancellable bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  async validateBookingRequest(bookingData: CreateBookingData): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const errors: string[] = []
      const warnings: string[] = []

      // Check if schedule exists and is valid
      // This would involve checking schedule repository in a real implementation

      // Check seat availability
      const seatIds = bookingData.seats.map(s => s.seatId)
      const seatsAvailable = await this.seatRepository.checkSeatAvailability(bookingData.scheduleId, seatIds)
      if (!seatsAvailable) {
        errors.push('One or more selected seats are not available')
      }

      // Validate passenger count matches seat count
      if (bookingData.seats.length === 0) {
        errors.push('At least one seat must be selected')
      }

      // Validate passenger details
      for (const seat of bookingData.seats) {
        if (!seat.passenger.name || seat.passenger.name.trim().length === 0) {
          errors.push('Passenger name is required for all seats')
        }
        if (!seat.passenger.age || seat.passenger.age < 1 || seat.passenger.age > 120) {
          errors.push('Valid passenger age is required for all seats')
        }
      }

      // Check for duplicate passengers (warning)
      const passengerNames = bookingData.seats.map(s => s.passenger.name.toLowerCase().trim())
      const uniqueNames = new Set(passengerNames)
      if (uniqueNames.size !== passengerNames.length) {
        warnings.push('Multiple seats booked for passengers with similar names')
      }

      // Validate contact details
      if (!bookingData.contactDetails.email || !bookingData.contactDetails.phone) {
        errors.push('Contact email and phone are required')
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      logger.error('Error validating booking request', { error: (error as Error).message, bookingData })
      return {
        valid: false,
        errors: ['Failed to validate booking request'],
        warnings: []
      }
    }
  }

  async checkBookingAccess(bookingId: number, userId: string): Promise<boolean> {
    try {
      return await this.bookingRepository.checkUserBookingAccess(bookingId, userId)
    } catch (error) {
      logger.error('Error checking booking access', { error: (error as Error).message, bookingId, userId })
      return false
    }
  }

  async canCancelBooking(bookingId: number, userId: string): Promise<boolean> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) return false

      // Check if user owns the booking
      if (booking.user_id !== userId) return false

      // Check if booking status allows cancellation
      if (booking.status !== 'confirmed' && booking.status !== 'pending') return false

      // Check if departure is at least 2 hours away
      const departure = new Date(booking.schedule.departure)
      const now = new Date()
      const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60)

      return hoursUntilDeparture >= 2

    } catch (error) {
      logger.error('Error checking if booking can be cancelled', { error: (error as Error).message, bookingId, userId })
      return false
    }
  }

  async calculateRefundAmount(bookingId: number): Promise<number> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) return 0

      const departure = new Date(booking.schedule.departure)
      const now = new Date()
      const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Simple refund policy - full refund if >24 hours, 50% if >2 hours, 0% otherwise
      if (hoursUntilDeparture >= 24) {
        return booking.total_amt
      } else if (hoursUntilDeparture >= 2) {
        return booking.total_amt * 0.5
      } else {
        return 0
      }

    } catch (error) {
      logger.error('Error calculating refund amount', { error: (error as Error).message, bookingId })
      return 0
    }
  }

  async getBookingStatistics(): Promise<BookingStatistics> {
    try {
      return await this.bookingRepository.getBookingStatistics()
    } catch (error) {
      logger.error('Error getting booking statistics', { error: (error as Error).message })
      throw error
    }
  }

  async getRevenueByPeriod(startDate: string, endDate: string): Promise<Array<{ period: string; revenue: number }>> {
    try {
      return await this.bookingRepository.getRevenueByPeriod(startDate, endDate)
    } catch (error) {
      logger.error('Error getting revenue by period', { error: (error as Error).message, startDate, endDate })
      throw error
    }
  }

  async getPopularRoutes(limit?: number): Promise<Array<{ route: string; bookings: number }>> {
    try {
      return await this.bookingRepository.getPopularRoutes(limit)
    } catch (error) {
      logger.error('Error getting popular routes', { error: (error as Error).message, limit })
      throw error
    }
  }

  async getBookingByReference(reference: string): Promise<BookingResponse | null> {
    try {
      const bookings = await this.bookingRepository.getBookingsByReference(reference)
      return bookings.length > 0 ? bookings[0] : null
    } catch (error) {
      logger.error('Error getting booking by reference', { error: (error as Error).message, reference })
      throw error
    }
  }

  generateBookingReference(bookingId: number): string {
    return `BK${bookingId.toString().padStart(6, '0')}`
  }

  async generateTicket(bookingId: number): Promise<string> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) throw new Error('Booking not found')

      // In a real implementation, this would generate a PDF ticket
      // For now, return a simple ticket URL
      return `/api/v1/bookings/${bookingId}/ticket`

    } catch (error) {
      logger.error('Error generating ticket', { error: (error as Error).message, bookingId })
      throw error
    }
  }

  async sendBookingConfirmation(bookingId: number): Promise<void> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) return

      // In a real implementation, this would send email/SMS confirmation
      logger.info('Booking confirmation sent', {
        bookingId,
        email: booking.contactDetails.email,
        phone: booking.contactDetails.phone
      })

    } catch (error) {
      logger.error('Error sending booking confirmation', { error: (error as Error).message, bookingId })
      // Don't throw - this is a non-critical operation
    }
  }

  async sendCancellationNotification(bookingId: number): Promise<void> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) return

      // In a real implementation, this would send email/SMS notification
      logger.info('Cancellation notification sent', {
        bookingId,
        email: booking.contactDetails.email,
        phone: booking.contactDetails.phone
      })

    } catch (error) {
      logger.error('Error sending cancellation notification', { error: (error as Error).message, bookingId })
      // Don't throw - this is a non-critical operation
    }
  }
}