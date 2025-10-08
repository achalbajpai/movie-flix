import { logger, businessConfig, canCancelBooking as canCancelByTime, calculateRefundAmount as calculateRefund } from '@/config'
import { TicketService, TicketData } from '../TicketService'
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
      logger.info('Starting atomic booking creation', {
        userId: bookingData.userId,
        showId: bookingData.showId,
        seatCount: bookingData.seats.length
      })

      // Validate booking request
      const validation = await this.validateBookingRequest(bookingData)
      if (!validation.valid) {
        throw new Error(`Booking validation failed: ${validation.errors.join(', ')}`)
      }

      const seatIds = bookingData.seats.map(s => s.seatId)
      const totalAmount = await this.seatRepository.calculateSeatPrices(bookingData.showId, seatIds)
      const bookingDataWithAmount = { ...bookingData, totalAmount }

      const booking = await this.bookingRepository.create(bookingDataWithAmount)

      // Generate booking confirmation
      const confirmation: BookingConfirmation = {
        bookingId: booking.booking_id,
        bookingReference: this.generateBookingReference(booking.booking_id),
        totalAmount: booking.total_amt,
        seats: booking.customers.map((c: any) => ({
          seatNo: c.seat_no,
          rowNumber: c.row_number || 'A',
          columnNumber: c.column_number || 1,
          customerName: c.customer_name,
          seatType: c.seat_type || 'Regular'
        })),
        show: {
          showTime: booking.show.show_time,
          endTime: booking.show.end_time,
          movieTitle: booking.show.movie?.title || 'Movie',
          theaterName: booking.show.theater?.name || 'Theater',
          screenName: booking.show.screen?.screen_name || 'Screen 1',
          screenType: booking.show.screen?.screen_type || 'Regular'
        },
        paymentStatus: 'confirmed' // In real implementation, this would come from payment gateway
      }

      this.sendBookingConfirmation(booking.booking_id).catch(error => {
        logger.warn('Failed to send booking confirmation', { error: error.message, bookingId: booking.booking_id })
      })

      logger.info('Atomic booking created successfully', {
        bookingId: booking.booking_id,
        userId: bookingData.userId,
        showId: bookingData.showId,
        seatCount: seatIds.length
      })

      return confirmation

    } catch (error) {
      const errorMessage = (error as Error).message
      logger.error('Error creating booking', {
        error: errorMessage,
        userId: bookingData.userId,
        showId: bookingData.showId
      })

      if (errorMessage.includes('Seats are currently being booked')) {
        throw new Error('These seats are being booked by another user. Please select different seats or try again.')
      }

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

  async getBookingsByShow(showId: number): Promise<BookingResponse[]> {
    try {
      return await this.bookingRepository.findByShowId(showId)
    } catch (error) {
      logger.error('Error getting bookings by show', { error: (error as Error).message, showId })
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

      // Check seat availability with detailed status
      const seatIds = bookingData.seats.map(s => s.seatId)
      const availabilityCheck = await this.seatRepository.checkDetailedSeatAvailability(bookingData.showId, seatIds)

      if (!availabilityCheck.available) {
        // Group seats by reason
        const bookedSeats = availabilityCheck.unavailableSeats.filter(s => s.reason === 'booked')
        const reservedSeats = availabilityCheck.unavailableSeats.filter(s => s.reason === 'reserved')
        const notFoundSeats = availabilityCheck.unavailableSeats.filter(s => s.reason === 'not_found')

        if (bookedSeats.length > 0) {
          const seatNos = bookedSeats.map(s => s.seatNo).join(', ')
          errors.push(`The following seats are already booked: ${seatNos}. Please select different seats.`)
        }

        if (reservedSeats.length > 0) {
          const seatNos = reservedSeats.map(s => s.seatNo).join(', ')
          const expiresAt = reservedSeats[0].reservationExpiresAt
          const minutesLeft = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000) : 0
          errors.push(`The following seats are temporarily held by another user: ${seatNos}. These seats will be released in approximately ${minutesLeft} minute(s). Please wait or select different seats.`)
        }

        if (notFoundSeats.length > 0) {
          const seatNos = notFoundSeats.map(s => s.seatNo).join(', ')
          errors.push(`The following seats do not exist: ${seatNos}`)
        }
      }

      // Validate passenger count matches seat count
      if (bookingData.seats.length === 0) {
        errors.push('At least one seat must be selected')
      }

      // Validate customer details
      for (const seat of bookingData.seats) {
        if (!seat.customer.name || seat.customer.name.trim().length === 0) {
          errors.push('Customer name is required for all seats')
        }
        if (!seat.customer.age || seat.customer.age < 1 || seat.customer.age > 120) {
          errors.push('Valid customer age is required for all seats')
        }
      }

      // Check for duplicate customers (warning)
      const customerNames = bookingData.seats.map(s => s.customer.name.toLowerCase().trim())
      const uniqueNames = new Set(customerNames)
      if (uniqueNames.size !== customerNames.length) {
        warnings.push('Multiple seats booked for customers with similar names')
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

      const showTime = new Date(booking.show.show_time)
      return canCancelByTime(showTime)

    } catch (error) {
      logger.error('Error checking if booking can be cancelled', { error: (error as Error).message, bookingId, userId })
      return false
    }
  }

  async calculateRefundAmount(bookingId: number): Promise<number> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) return 0

      const showTime = new Date(booking.show.show_time)
      return calculateRefund(booking.total_amt, showTime)

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

  async getPopularMovies(limit?: number): Promise<Array<{ movie: string; bookings: number }>> {
    try {
      return await this.bookingRepository.getPopularMovies(limit)
    } catch (error) {
      logger.error('Error getting popular movies', { error: (error as Error).message, limit })
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

  async generateTicket(bookingId: number): Promise<Buffer> {
    try {
      const booking = await this.bookingRepository.findById(bookingId)
      if (!booking) throw new Error('Booking not found')

      // Prepare ticket data
      const ticketData: TicketData = {
        bookingId: this.generateBookingReference(bookingId),
        customerName: booking.customers?.[0]?.customer_name || 'Customer',
        theaterName: booking.show?.theater?.name || 'Theater',
        movieTitle: booking.show?.movie?.title || 'Movie',
        showTime: booking.show?.show_time || 'N/A',
        showDate: booking.show?.show_time ? new Date(booking.show.show_time).toLocaleDateString() : 'N/A',
        screenName: booking.show?.screen?.screen_name || 'Screen',
        seatNumbers: booking.customers?.map(customer => customer.seat_no) || [],
        totalAmount: booking.total_amt || 0,
        contactEmail: booking.contactDetails?.email || '',
        contactPhone: booking.contactDetails?.phone || ''
      }

      // Generate PDF ticket
      const pdfBuffer = TicketService.generateTicketPDF(ticketData)

      logger.info('Ticket generated successfully', { bookingId })
      return pdfBuffer

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