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
  BookingSeatWithDetails,
  ScheduleDetails
} from '@/models'

export class SupabaseBookingRepository implements IBookingRepository {

  async create(bookingData: CreateBookingData): Promise<BookingResponse> {
    try {
      // Start transaction by creating booking first
      const { data: booking, error: bookingError } = await supabase
        .from('Booking')
        .insert({
          user_id: bookingData.userId,
          schedule_id: bookingData.scheduleId,
          status: 'confirmed',
          total_amt: bookingData.totalAmount
        })
        .select('*')
        .single()

      if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`)

      // Create booking seats with passenger details
      const bookingSeats = bookingData.seats.map(seat => ({
        booking_id: booking.booking_id,
        seat_id: seat.seatId,
        pass_name: seat.passenger.name,
        pass_age: seat.passenger.age,
        gender: seat.passenger.gender
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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
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
      // Get booking details first to release seats
      const booking = await this.findById(bookingId)
      if (!booking) throw new Error('Booking not found')

      // Update booking status to cancelled
      const { error: updateError } = await supabase
        .from('Booking')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)

      if (updateError) throw new Error(`Failed to cancel booking: ${updateError.message}`)

      // Release seats
      const seatIds = booking.passengers.map(p => p.seat_id)
      const { error: seatError } = await supabase
        .from('Seat')
        .update({ is_reserved: false })
        .in('seat_id', seatIds)

      if (seatError) {
        logger.warn('Failed to release seats after cancellation', { error: seatError.message, seatIds })
      }

      return await this.findById(bookingId) as BookingResponse

    } catch (error) {
      logger.error('Error cancelling booking', { error: (error as Error).message, bookingId, cancelData })
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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
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

  async findByScheduleId(scheduleId: number): Promise<BookingResponse[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select(`
          *,
          Booking_seat (
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
          )
        `)
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to find bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding bookings by schedule', { error: (error as Error).message, scheduleId })
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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
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

      // Get popular routes
      const { data: routeData, error: routeError } = await supabase
        .rpc('get_popular_booking_routes', { limit_count: 10 })

      const popularRoutes = routeError ? [] : routeData || []

      return {
        totalBookings,
        totalRevenue,
        bookingsByStatus,
        revenueByPeriod,
        popularRoutes
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

  async getPopularRoutes(limit = 10): Promise<Array<{ route: string; bookings: number }>> {
    try {
      const { data, error } = await supabase
        .from('Booking')
        .select(`
          Schedules (
            Routes (source_des, drop_des)
          )
        `)
        .eq('status', 'confirmed')

      if (error) throw new Error(`Failed to get popular routes: ${error.message}`)

      // Group by route
      const routeCounts = data?.reduce((acc: Record<string, number>, booking: any) => {
        const route = `${booking.Schedules?.Routes?.source_des} to ${booking.Schedules?.Routes?.drop_des}`
        acc[route] = (acc[route] || 0) + 1
        return acc
      }, {}) || {}

      return Object.entries(routeCounts)
        .map(([route, bookings]) => ({ route, bookings: bookings as number }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, limit)

    } catch (error) {
      logger.error('Error getting popular routes', { error: (error as Error).message, limit })
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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
          )
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending'])
        .filter('Schedules.departure', 'gte', new Date().toISOString())
        .order('Schedules.departure', { ascending: true })

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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
          )
        `)
        .eq('user_id', userId)
        .filter('Schedules.departure', 'lt', new Date().toISOString())
        .order('Schedules.departure', { ascending: false })

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
            booking_s_id,
            seat_id,
            pass_name,
            pass_age,
            gender,
            Seat (seat_no, price)
          ),
          Schedules (
            schedule_id,
            departure,
            arrival,
            base_price,
            Bus (bus_id, bus_no, bus_type, total_seats, Operator (operator_id, company, verification)),
            Routes (route_id, source_des, drop_des, distance, approx_time)
          )
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending'])
        .filter('Schedules.departure', 'gte', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // 2 hours from now
        .order('Schedules.departure', { ascending: true })

      if (error) throw new Error(`Failed to find cancellable bookings: ${error.message}`)

      return bookings?.map(booking => this.transformBookingData(booking as any)) || []

    } catch (error) {
      logger.error('Error finding cancellable bookings', { error: (error as Error).message, userId })
      throw error
    }
  }

  private transformBookingData(booking: any): BookingResponse {
    return {
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      schedule_id: booking.schedule_id,
      status: booking.status,
      price: booking.price,
      total_amt: booking.total_amt,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      passengers: booking.Booking_seat?.map((bs: any) => ({
        booking_s_id: bs.booking_s_id,
        seat_id: bs.seat_id,
        seat_no: bs.Seat?.seat_no,
        pass_name: bs.pass_name,
        pass_age: bs.pass_age,
        gender: bs.gender,
        price: bs.Seat?.price || 0
      })) || [],
      schedule: {
        schedule_id: booking.Schedules?.schedule_id,
        departure: booking.Schedules?.departure,
        arrival: booking.Schedules?.arrival,
        base_price: booking.Schedules?.base_price,
        bus: booking.Schedules?.Bus ? {
          bus_id: booking.Schedules.Bus.bus_id,
          bus_no: booking.Schedules.Bus.bus_no,
          bus_type: booking.Schedules.Bus.bus_type,
          total_seats: booking.Schedules.Bus.total_seats
        } : {} as any,
        route: booking.Schedules?.Routes ? {
          route_id: booking.Schedules.Routes.route_id,
          source_des: booking.Schedules.Routes.source_des,
          drop_des: booking.Schedules.Routes.drop_des,
          distance: booking.Schedules.Routes.distance,
          approx_time: booking.Schedules.Routes.approx_time
        } : {} as any,
        operator: booking.Schedules?.Bus?.Operator ? {
          operator_id: booking.Schedules.Bus.Operator.operator_id,
          company: booking.Schedules.Bus.Operator.company,
          verification: booking.Schedules.Bus.Operator.verification
        } : {} as any
      },
      contactDetails: {
        email: booking.contact_email || '',
        phone: booking.contact_phone || ''
      }
    }
  }
}