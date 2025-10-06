import { supabase } from '@/config/supabase'
import { logger } from '@/config'
import {
  IBookingRepository,
  BookingResponse,
  BookingQuery,
  CreateBookingData,
  BookingStatistics,
  BookingHistory,
  CancelBookingRequest,
  BookingStatus,
  DatabaseBooking,
  DatabaseBookingSeat,
  BookingSeatWithDetails
} from '@/models'

export class SupabaseBookingRepository implements IBookingRepository {

  async create(bookingData: CreateBookingData): Promise<BookingResponse> {
    try {
      // Start transaction by creating booking first
      const { data: booking, error: bookingError } = await supabase
        .from('Booking')
        .insert({
          user_id: bookingData.userId,
          show_id: bookingData.showId,
          status: 'confirmed',
          total_amt: bookingData.totalAmount
        })
        .select('*')
        .single()

      if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`)

      // Create booking seats with customer details
      // Use contact details from bookingData for all seats, or individual customer details if provided
      const bookingSeats = bookingData.seats.map(seat => ({
        booking_id: booking.booking_id,
        seat_id: seat.seatId,
        customer_name: seat.customer.name,
        customer_age: seat.customer.age,
        gender: seat.customer.gender,
        customer_email: bookingData.contactDetails.email, // Use booking-level contact email
        customer_phone: bookingData.contactDetails.phone  // Use booking-level contact phone
      }))

      const { error: seatsError } = await supabase
        .from('Booking_seat')
        .insert(bookingSeats)

      if (seatsError) {
        // Rollback booking if seat creation fails
        await supabase.from('Booking').delete().eq('booking_id', booking.booking_id)
        throw new Error(`Failed to create booking seats: ${seatsError.message}`)
      }

      // Mark seats as booked
      const seatIds = bookingData.seats.map(s => s.seatId)
      const { error: updateSeatsError } = await supabase
        .from('Seat')
        .update({ is_reserved: true })
        .in('seat_id', seatIds)

      if (updateSeatsError) {
        logger.warn('Failed to mark seats as reserved', { error: updateSeatsError.message, seatIds })
      }

      return await this.findById(booking.booking_id) as BookingResponse

    } catch (error) {
      logger.error('Error creating booking', { error: (error as Error).message, bookingData })
      throw error
    }
  }

  async findById(bookingId: number): Promise<BookingResponse | null> {
    try {
      const { data: booking, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            customer_email,
            customer_phone,
            gender,
            Seat (seat_no, price, seat_type, row_number, column_number)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .eq('booking_id', bookingId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw new Error(`Failed to find booking: ${error.message}`)
      }

      return this.transformBookingData(booking as any)

    } catch (error) {
      logger.error('Error finding booking by ID', { error: (error as Error).message, bookingId })
      throw error
    }
  }

  async findByUserId(userId: string, query?: Partial<BookingQuery>): Promise<BookingHistory> {
    try {
      const page = query?.page || 1
      const limit = query?.limit || 20
      const offset = (page - 1) * limit

      let queryBuilder = supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (query?.status) {
        queryBuilder = queryBuilder.eq('status', query.status)
      }
      if (query?.fromDate) {
        queryBuilder = queryBuilder.gte('created_at', query.fromDate)
      }
      if (query?.toDate) {
        queryBuilder = queryBuilder.lte('created_at', query.toDate)
      }

      const { data: bookings, error, count } = await queryBuilder
        .range(offset, offset + limit - 1)

      if (error) throw new Error(`Failed to find bookings: ${error.message}`)

      const transformedBookings = bookings?.map(booking => this.transformBookingData(booking as any)) || []

      return {
        bookings: transformedBookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count || 0) / limit),
          totalItems: count || 0,
          hasNext: page < Math.ceil((count || 0) / limit),
          hasPrevious: page > 1,
          limit
        }
      }

    } catch (error) {
      logger.error('Error finding bookings by user ID', { error: (error as Error).message, userId, query })
      throw error
    }
  }

  async updateStatus(bookingId: number, status: BookingStatus): Promise<BookingResponse> {
    try {
      const { data: booking, error } = await supabase
        .from('Booking')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .select('*')
        .single()

      if (error) throw new Error(`Failed to update booking status: ${error.message}`)

      return await this.findById(bookingId) as BookingResponse

    } catch (error) {
      logger.error('Error updating booking status', { error: (error as Error).message, bookingId, status })
      throw error
    }
  }

  async cancel(bookingId: number, cancelData: CancelBookingRequest): Promise<BookingResponse> {
    try {
      logger.info('[Repository] Cancelling booking', { bookingId, cancelData })

      // Get booking details first to release seats
      const booking = await this.findById(bookingId)
      if (!booking) {
        logger.error('[Repository] Booking not found', { bookingId })
        throw new Error('Booking not found')
      }

      logger.info('[Repository] Current booking status', { bookingId, currentStatus: booking.status })

      // Update booking status to cancelled
      const { data: updateData, error: updateError } = await supabase
        .from('Booking')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .select()

      if (updateError) {
        logger.error('[Repository] Failed to update booking status', { error: updateError.message, bookingId })
        throw new Error(`Failed to cancel booking: ${updateError.message}`)
      }

      logger.info('[Repository] Booking status updated to cancelled', { bookingId, updateData })

      // Release seats
      const seatIds = booking.customers.map(c => c.seat_id)
      const { data: seatData, error: seatError } = await supabase
        .from('Seat')
        .update({ is_reserved: false })
        .in('seat_id', seatIds)
        .select()

      if (seatError) {
        logger.warn('[Repository] Failed to release seats after cancellation', { error: seatError.message, seatIds })
      } else {
        logger.info('[Repository] Seats released successfully', { seatIds, seatData })
      }

      const cancelledBooking = await this.findById(bookingId) as BookingResponse
      logger.info('[Repository] Cancelled booking retrieved', { bookingId, newStatus: cancelledBooking.status })

      return cancelledBooking

    } catch (error) {
      logger.error('[Repository] Error cancelling booking', { error: (error as Error).message, bookingId, cancelData })
      throw error
    }
  }

  async findAll(query?: BookingQuery): Promise<BookingHistory> {
    try {
      const page = query?.page || 1
      const limit = query?.limit || 20
      const offset = (page - 1) * limit

      let queryBuilder = supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (query?.userId) {
        queryBuilder = queryBuilder.eq('user_id', query.userId)
      }
      if (query?.status) {
        queryBuilder = queryBuilder.eq('status', query.status)
      }
      if (query?.fromDate) {
        queryBuilder = queryBuilder.gte('created_at', query.fromDate)
      }
      if (query?.toDate) {
        queryBuilder = queryBuilder.lte('created_at', query.toDate)
      }

      const { data: bookings, error, count } = await queryBuilder
        .range(offset, offset + limit - 1)

      if (error) throw new Error(`Failed to find bookings: ${error.message}`)

      const transformedBookings = bookings?.map(booking => this.transformBookingData(booking as any)) || []

      return {
        bookings: transformedBookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count || 0) / limit),
          totalItems: count || 0,
          hasNext: page < Math.ceil((count || 0) / limit),
          hasPrevious: page > 1,
          limit
        }
      }

    } catch (error) {
      logger.error('Error finding all bookings', { error: (error as Error).message, query })
      throw error
    }
  }

  async findByShowId(showId: number): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .eq('show_id', showId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to find bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding bookings by schedule', { error: (error as Error).message, showId })
      throw error
    }
  }

  async findByDateRange(fromDate: string, toDate: string): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to find bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding bookings by date range', { error: (error as Error).message, fromDate, toDate })
      throw error
    }
  }

  async findByStatus(status: BookingStatus): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to find bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding bookings by status', { error: (error as Error).message, status })
      throw error
    }
  }

  async getBookingStatistics(): Promise<BookingStatistics> {
    try {
      // Get total bookings and revenue
      const { data: totalStats, error: totalError } = await supabase
        .from('Booking')
        .select('total_amt, status')

      if (totalError) throw new Error(`Failed to get booking statistics: ${totalError.message}`)

      const totalBookings = totalStats?.length || 0
      const totalRevenue = totalStats?.reduce((sum, booking) => sum + (booking.total_amt || 0), 0) || 0

      // Get bookings by status
      const statusCounts = totalStats?.reduce((acc: Record<string, number>, booking) => {
        acc[booking.status || 'unknown'] = (acc[booking.status || 'unknown'] || 0) + 1
        return acc
      }, {}) || {}

      const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status as BookingStatus,
        count: count as number
      }))

      // Get revenue by period (last 12 months)
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_revenue_by_month')

      const revenueByPeriod = revenueError ? [] : revenueData || []

      // Get popular movies
      const popularMovies = await this.getPopularMovies(10)

      // Get popular theaters (simplified implementation)
      const popularTheaters: Array<{ theater: string; bookings: number }> = []

      return {
        totalBookings,
        totalRevenue,
        bookingsByStatus,
        revenueByPeriod,
        popularMovies,
        popularTheaters
      }

    } catch (error) {
      logger.error('Error getting booking statistics', { error: (error as Error).message })
      throw error
    }
  }

  async getRevenueByPeriod(startDate: string, endDate: string): Promise<Array<{ period: string; revenue: number }>> {
    try {
      const { data, error } = await supabase
        .from('Booking')
        .select('created_at, total_amt')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'confirmed')

      if (error) throw new Error(`Failed to get revenue data: ${error.message}`)

      // Group by month/period
      const revenueByPeriod = data?.reduce((acc: Record<string, number>, booking) => {
        const period = booking.created_at.substring(0, 7) // YYYY-MM format
        acc[period] = (acc[period] || 0) + (booking.total_amt || 0)
        return acc
      }, {}) || {}

      return Object.entries(revenueByPeriod).map(([period, revenue]) => ({
        period,
        revenue: revenue as number
      }))

    } catch (error) {
      logger.error('Error getting revenue by period', { error: (error as Error).message, startDate, endDate })
      throw error
    }
  }

  async getPopularMovies(limit = 10): Promise<Array<{ movie: string; bookings: number }>> {
    try {
      const { data, error } = await supabase
        .from('Booking')
        .select(`
          show (
            movie (title)
          )
        `)
        .eq('status', 'confirmed')

      if (error) throw new Error(`Failed to get popular movies: ${error.message}`)

      // Group by movie title
      const movieCounts = data?.reduce((acc: Record<string, number>, booking: any) => {
        const movieTitle = booking.Show?.Movie?.title
        if (movieTitle) {
          acc[movieTitle] = (acc[movieTitle] || 0) + 1
        }
        return acc
      }, {}) || {}

      return Object.entries(movieCounts)
        .map(([movie, bookings]) => ({ movie, bookings: bookings as number }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, limit)

    } catch (error) {
      logger.error('Error getting popular movies', { error: (error as Error).message, limit })
      throw error
    }
  }

  async checkBookingExists(bookingId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('Booking')
        .select('booking_id')
        .eq('booking_id', bookingId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check booking existence: ${error.message}`)
      }

      return !!data

    } catch (error) {
      logger.error('Error checking booking existence', { error: (error as Error).message, bookingId })
      throw error
    }
  }

  async checkUserBookingAccess(bookingId: number, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('Booking')
        .select('booking_id')
        .eq('booking_id', bookingId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check booking access: ${error.message}`)
      }

      return !!data

    } catch (error) {
      logger.error('Error checking booking access', { error: (error as Error).message, bookingId, userId })
      throw error
    }
  }

  async getBookingsByReference(reference: string): Promise<BookingResponse[]> {
    try {
      // Extract booking ID from reference (BK000123 -> 123)
      const bookingId = parseInt(reference.replace('BK', '').replace(/^0+/, ''))

      if (isNaN(bookingId)) return []

      const booking = await this.findById(bookingId)
      return booking ? [booking] : []

    } catch (error) {
      logger.error('Error getting bookings by reference', { error: (error as Error).message, reference })
      throw error
    }
  }

  async findUpcomingBookings(userId: string): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending'])
        .filter('show.show_time', 'gte', new Date().toISOString())
        .order('show.show_time', { ascending: true })

      if (error) throw new Error(`Failed to find upcoming bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding upcoming bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  async findPastBookings(userId: string): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .eq('user_id', userId)
        .filter('show.show_time', 'lt', new Date().toISOString())
        .order('show.show_time', { ascending: false })

      if (error) throw new Error(`Failed to find past bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding past bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  async findCancellableBookings(userId: string): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            ticket_id,
            seat_id,
            customer_name,
            customer_age,
            gender,
            Seat (seat_no, price)
          ),
          show (
            show_id,
            show_time,
            end_time,
            base_price,
            show_type,
            movie (movie_id, title, description, duration, genre, rating, poster_url, language),
            screen (screen_id, screen_name, screen_type, total_seats, theater (theater_id, name, location, city, phone, email))
          )
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending'])
        .filter('show.show_time', 'gte', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // 2 hours from now
        .order('show.show_time', { ascending: true })

      if (error) throw new Error(`Failed to find cancellable bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding cancellable bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  private transformBookingData(booking: any): BookingResponse {
    // Extract contact details from the first booking seat (all seats have same contact info)
    const firstSeat = booking.Booking_seat?.[0]
    const contactEmail = firstSeat?.customer_email || ''
    const contactPhone = firstSeat?.customer_phone || ''

    return {
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      show_id: booking.show_id,
      status: booking.status,
      price: booking.price,
      total_amt: booking.total_amt,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      customers: booking.Booking_seat?.map((bs: any) => ({
        ticket_id: bs.ticket_id,
        seat_id: bs.seat_id,
        seat_no: bs.Seat?.seat_no,
        row_number: bs.Seat?.row_number || 'A',
        column_number: bs.Seat?.column_number || 1,
        customer_name: bs.customer_name,
        customer_age: bs.customer_age,
        customer_email: bs.customer_email,
        customer_phone: bs.customer_phone,
        gender: bs.gender,
        price: bs.Seat?.price || 0,
        seat_type: bs.Seat?.seat_type || 'Regular'
      })) || [],
      show: {
        show_id: booking.show?.show_id || booking.show_id,
        show_time: booking.show?.show_time || '',
        end_time: booking.show?.end_time || '',
        base_price: booking.show?.base_price || 0,
        show_type: booking.show?.show_type || 'Regular',
        language: booking.show?.language || null,
        movie: booking.show?.movie ? {
          movie_id: booking.show.movie.movie_id,
          title: booking.show.movie.title,
          description: booking.show.movie.description,
          duration: booking.show.movie.duration,
          genre: booking.show.movie.genre,
          rating: booking.show.movie.rating,
          poster_url: booking.show.movie.poster_url
        } : {} as any,
        screen: booking.show?.screen ? {
          screen_id: booking.show.screen.screen_id,
          screen_name: booking.show.screen.screen_name,
          screen_type: booking.show.screen.screen_type,
          total_seats: booking.show.screen.total_seats
        } : {} as any,
        theater: booking.show?.screen?.theater ? {
          theater_id: booking.show.screen.theater.theater_id,
          name: booking.show.screen.theater.name,
          location: booking.show.screen.theater.location,
          city: booking.show.screen.theater.city,
          phone: booking.show.screen.theater.phone,
          email: booking.show.screen.theater.email
        } : {} as any
      },
      contactDetails: {
        email: contactEmail,
        phone: contactPhone
      }
    }
  }
}