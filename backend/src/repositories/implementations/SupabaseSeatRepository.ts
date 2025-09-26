import { supabase } from '@/config/supabase'
import { logger } from '@/config'
import {
  ISeatRepository,
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus,
  SeatLayoutRow
} from '@/models'

export class SupabaseSeatRepository implements ISeatRepository {

  async findByScheduleId(scheduleId: number): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('seat_no')

      if (error) throw new Error(`Failed to find seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding seats by schedule ID', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async findAvailableSeats(scheduleId: number): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('is_reserved', false)
        .order('seat_no')

      if (error) throw new Error(`Failed to find available seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding available seats', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getSeatLayout(scheduleId: number): Promise<SeatLayout> {
    try {
      // Get schedule and bus information
      const { data: schedule, error: scheduleError } = await supabase
        .from('Schedules')
        .select(`
          *,
          Bus (
            bus_id,
            bus_type,
            total_seats
          )
        `)
        .eq('schedule_id', scheduleId)
        .maybeSingle()

      if (scheduleError) throw new Error(`Failed to get schedule: ${scheduleError.message}`)

      if (!schedule) {
        throw new Error(`Schedule with ID ${scheduleId} not found`)
      }

      // Get all seats for this schedule
      const seats = await this.findByScheduleId(scheduleId)

      // Determine layout based on bus type
      const busType = schedule.Bus?.bus_type || 'standard'
      const totalSeats = schedule.Bus?.total_seats || seats.length

      // Create seat layout based on bus type
      const layout = this.createSeatLayout(seats, busType)

      return {
        totalSeats,
        layout,
        busType
      }

    } catch (error) {
      logger.error('Error getting seat layout', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async checkSeatAvailability(scheduleId: number, seatIds: number[]): Promise<boolean> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('seat_id, is_reserved, reservation_expires_at')
        .eq('schedule_id', scheduleId)
        .in('seat_id', seatIds)

      if (error) throw new Error(`Failed to check seat availability: ${error.message}`)

      if (!seats || seats.length !== seatIds.length) {
        return false // Some seats don't exist
      }

      // Check if all seats are available or have expired reservations
      const now = new Date()
      return seats.every(seat => {
        if (!seat.is_reserved) return true
        if (seat.reservation_expires_at && new Date(seat.reservation_expires_at) < now) {
          // Reservation has expired, clean it up
          this.updateSeatStatus(seat.seat_id, SeatStatus.AVAILABLE)
          return true
        }
        return false
      })

    } catch (error) {
      logger.error('Error checking seat availability', { error: (error as Error).message, scheduleId, seatIds })
      throw error
    }
  }

  async updateSeatStatus(seatId: number, status: SeatStatus): Promise<SeatDetails> {
    try {
      const isReserved = status === SeatStatus.BOOKED || status === SeatStatus.RESERVED

      const { data: seat, error } = await supabase
        .from('Seat')
        .update({
          is_reserved: isReserved,
          updated_at: new Date().toISOString()
        })
        .eq('seat_id', seatId)
        .select('*')
        .single()

      if (error) throw new Error(`Failed to update seat status: ${error.message}`)

      return {
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      }

    } catch (error) {
      logger.error('Error updating seat status', { error: (error as Error).message, seatId, status })
      throw error
    }
  }

  async updateMultipleSeatStatus(seatIds: number[], status: SeatStatus): Promise<SeatDetails[]> {
    try {
      const isReserved = status === SeatStatus.BOOKED || status === SeatStatus.RESERVED

      const { data: seats, error } = await supabase
        .from('Seat')
        .update({
          is_reserved: isReserved,
          updated_at: new Date().toISOString()
        })
        .in('seat_id', seatIds)
        .select('*')

      if (error) throw new Error(`Failed to update seat status: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error updating multiple seat status', { error: (error as Error).message, seatIds, status })
      throw error
    }
  }

  async markSeatsAsBooked(seatIds: number[], bookingId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('Seat')
        .update({
          is_reserved: true,
          booking_id: bookingId,
          updated_at: new Date().toISOString()
        })
        .in('seat_id', seatIds)

      if (error) throw new Error(`Failed to mark seats as booked: ${error.message}`)

    } catch (error) {
      logger.error('Error marking seats as booked', { error: (error as Error).message, seatIds, bookingId })
      throw error
    }
  }

  async releaseSeats(seatIds: number[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('Seat')
        .update({
          is_reserved: false,
          booking_id: null,
          reservation_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .in('seat_id', seatIds)

      if (error) throw new Error(`Failed to release seats: ${error.message}`)

    } catch (error) {
      logger.error('Error releasing seats', { error: (error as Error).message, seatIds })
      throw error
    }
  }

  async createReservation(reservationData: SeatReservationRequest): Promise<SeatReservation> {
    try {
      // Check if seats are available
      const isAvailable = await this.checkSeatAvailability(reservationData.scheduleId, reservationData.seatIds)
      if (!isAvailable) {
        throw new Error('One or more seats are not available')
      }

      // Create reservation record
      const reservationId = `RSV_${Date.now()}_${reservationData.userId}`
      const expiresAt = reservationData.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes default

      const { data: reservation, error: reservationError } = await supabase
        .from('seatreservation')
        .insert({
          reservation_id: reservationId,
          schedule_id: reservationData.scheduleId,
          seat_ids: reservationData.seatIds,
          user_id: reservationData.userId,
          expires_at: expiresAt
        })
        .select('*')
        .single()

      if (reservationError) throw new Error(`Failed to create reservation: ${reservationError.message}`)

      // Mark seats as reserved
      const { error: seatError } = await supabase
        .from('Seat')
        .update({
          is_reserved: true,
          reservation_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .in('seat_id', reservationData.seatIds)

      if (seatError) {
        // Rollback reservation if seat update fails
        await supabase.from('seatreservation').delete().eq('reservation_id', reservationId)
        throw new Error(`Failed to reserve seats: ${seatError.message}`)
      }

      return {
        reservation_id: reservation.reservation_id,
        schedule_id: reservation.schedule_id,
        seat_ids: reservation.seat_ids,
        user_id: reservation.user_id,
        expires_at: reservation.expires_at,
        created_at: reservation.created_at
      }

    } catch (error) {
      logger.error('Error creating seat reservation', { error: (error as Error).message, reservationData })
      throw error
    }
  }

  async findReservation(reservationId: string): Promise<SeatReservation | null> {
    try {
      const { data: reservation, error } = await supabase
        .from('seatreservation')
        .select('*')
        .eq('reservation_id', reservationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw new Error(`Failed to find reservation: ${error.message}`)
      }

      return {
        reservation_id: reservation.reservation_id,
        schedule_id: reservation.schedule_id,
        seat_ids: reservation.seat_ids,
        user_id: reservation.user_id,
        expires_at: reservation.expires_at,
        created_at: reservation.created_at
      }

    } catch (error) {
      logger.error('Error finding reservation', { error: (error as Error).message, reservationId })
      throw error
    }
  }

  async findReservationsByUser(userId: string): Promise<SeatReservation[]> {
    try {
      const { data: reservations, error } = await supabase
        .from('seatreservation')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to find reservations: ${error.message}`)

      return reservations?.map(reservation => ({
        reservation_id: reservation.reservation_id,
        schedule_id: reservation.schedule_id,
        seat_ids: reservation.seat_ids,
        user_id: reservation.user_id,
        expires_at: reservation.expires_at,
        created_at: reservation.created_at
      })) || []

    } catch (error) {
      logger.error('Error finding reservations by user', { error: (error as Error).message, userId })
      throw error
    }
  }

  async extendReservation(reservationId: string, expiresAt: string): Promise<SeatReservation> {
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('seatreservation')
        .update({
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('reservation_id', reservationId)
        .select('*')
        .single()

      if (reservationError) throw new Error(`Failed to extend reservation: ${reservationError.message}`)

      // Update seat reservation expiry
      const { error: seatError } = await supabase
        .from('Seat')
        .update({
          reservation_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .in('seat_id', reservation.seat_ids)

      if (seatError) {
        logger.warn('Failed to update seat reservation expiry', { error: seatError.message, reservationId })
      }

      return {
        reservation_id: reservation.reservation_id,
        schedule_id: reservation.schedule_id,
        seat_ids: reservation.seat_ids,
        user_id: reservation.user_id,
        expires_at: reservation.expires_at,
        created_at: reservation.created_at
      }

    } catch (error) {
      logger.error('Error extending reservation', { error: (error as Error).message, reservationId, expiresAt })
      throw error
    }
  }

  async cancelReservation(reservationId: string): Promise<void> {
    try {
      // Get reservation details first
      const reservation = await this.findReservation(reservationId)
      if (!reservation) return

      // Release seats
      await this.releaseSeats(reservation.seat_ids)

      // Delete reservation record
      const { error } = await supabase
        .from('seatreservation')
        .delete()
        .eq('reservation_id', reservationId)

      if (error) throw new Error(`Failed to cancel reservation: ${error.message}`)

    } catch (error) {
      logger.error('Error cancelling reservation', { error: (error as Error).message, reservationId })
      throw error
    }
  }

  async cleanupExpiredReservations(): Promise<void> {
    try {
      const now = new Date().toISOString()

      // Find expired reservations
      const { data: expiredReservations, error: findError } = await supabase
        .from('seatreservation')
        .select('*')
        .lt('expires_at', now)

      if (findError) throw new Error(`Failed to find expired reservations: ${findError.message}`)

      if (!expiredReservations || expiredReservations.length === 0) return

      // Release seats from expired reservations
      const allSeatIds = expiredReservations.flatMap(reservation => reservation.seat_ids)
      if (allSeatIds.length > 0) {
        await this.releaseSeats(allSeatIds)
      }

      // Delete expired reservations
      const reservationIds = expiredReservations.map(r => r.reservation_id)
      const { error: deleteError } = await supabase
        .from('seatreservation')
        .delete()
        .in('reservation_id', reservationIds)

      if (deleteError) throw new Error(`Failed to delete expired reservations: ${deleteError.message}`)

      logger.info('Cleaned up expired reservations', { count: expiredReservations.length })

    } catch (error) {
      logger.error('Error cleaning up expired reservations', { error: (error as Error).message })
      throw error
    }
  }

  async findSeatById(seatId: number): Promise<SeatDetails | null> {
    try {
      const { data: seat, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('seat_id', seatId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw new Error(`Failed to find seat: ${error.message}`)
      }

      return {
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      }

    } catch (error) {
      logger.error('Error finding seat by ID', { error: (error as Error).message, seatId })
      throw error
    }
  }

  async findSeatsByIds(seatIds: number[]): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .in('seat_id', seatIds)
        .order('seat_no')

      if (error) throw new Error(`Failed to find seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding seats by IDs', { error: (error as Error).message, seatIds })
      throw error
    }
  }

  async findSeatByNumber(scheduleId: number, seatNumber: string): Promise<SeatDetails | null> {
    try {
      const { data: seat, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('seat_no', seatNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw new Error(`Failed to find seat: ${error.message}`)
      }

      return {
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      }

    } catch (error) {
      logger.error('Error finding seat by number', { error: (error as Error).message, scheduleId, seatNumber })
      throw error
    }
  }

  async calculateSeatPrices(scheduleId: number, seatIds: number[]): Promise<number> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('price')
        .eq('schedule_id', scheduleId)
        .in('seat_id', seatIds)

      if (error) throw new Error(`Failed to calculate seat prices: ${error.message}`)

      return seats?.reduce((total, seat) => total + (seat.price || 0), 0) || 0

    } catch (error) {
      logger.error('Error calculating seat prices', { error: (error as Error).message, scheduleId, seatIds })
      throw error
    }
  }

  async getSeatPrice(seatId: number): Promise<number> {
    try {
      const { data: seat, error } = await supabase
        .from('Seat')
        .select('price')
        .eq('seat_id', seatId)
        .single()

      if (error) throw new Error(`Failed to get seat price: ${error.message}`)

      return seat?.price || 0

    } catch (error) {
      logger.error('Error getting seat price', { error: (error as Error).message, seatId })
      throw error
    }
  }

  async findBookedSeatsBySchedule(scheduleId: number): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('is_reserved', true)
        .order('seat_no')

      if (error) throw new Error(`Failed to find booked seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        schedule_id: seat.schedule_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding booked seats by schedule', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async findSeatsByBookingId(bookingId: number): Promise<SeatDetails[]> {
    try {
      const { data: bookingSeats, error } = await supabase
        .from('Booking_seat')
        .select(`
          seat_id,
          Seat (*)
        `)
        .eq('booking_id', bookingId)

      if (error) throw new Error(`Failed to find seats by booking ID: ${error.message}`)

      return bookingSeats?.map((bs: any) => ({
        seat_id: bs.Seat.seat_id,
        schedule_id: bs.Seat.schedule_id,
        seat_no: bs.Seat.seat_no,
        is_reserved: bs.Seat.is_reserved,
        price: bs.Seat.price,
        reservation_expires_at: bs.Seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding seats by booking ID', { error: (error as Error).message, bookingId })
      throw error
    }
  }

  async getSeatOccupancyRate(scheduleId: number): Promise<number> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('is_reserved')
        .eq('schedule_id', scheduleId)

      if (error) throw new Error(`Failed to get seat occupancy rate: ${error.message}`)

      if (!seats || seats.length === 0) return 0

      const bookedSeats = seats.filter(seat => seat.is_reserved).length
      return (bookedSeats / seats.length) * 100

    } catch (error) {
      logger.error('Error getting seat occupancy rate', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  async getPopularSeats(scheduleId: number): Promise<Array<{ seatNo: string; bookingCount: number }>> {
    try {
      const { data: seatBookings, error } = await supabase
        .from('Booking_seat')
        .select(`
          Seat (seat_no)
        `)
        .eq('Booking.schedule_id', scheduleId)

      if (error) throw new Error(`Failed to get popular seats: ${error.message}`)

      // Count bookings per seat
      const seatCounts = seatBookings?.reduce((acc: Record<string, number>, booking: any) => {
        const seatNo = booking.Seat?.seat_no
        if (seatNo) {
          acc[seatNo] = (acc[seatNo] || 0) + 1
        }
        return acc
      }, {}) || {}

      return Object.entries(seatCounts)
        .map(([seatNo, bookingCount]) => ({ seatNo, bookingCount: bookingCount as number }))
        .sort((a, b) => b.bookingCount - a.bookingCount)

    } catch (error) {
      logger.error('Error getting popular seats', { error: (error as Error).message, scheduleId })
      throw error
    }
  }

  private createSeatLayout(seats: SeatDetails[], busType: string): SeatLayoutRow[] {
    // Create layout based on bus type and seat numbers
    const layout: SeatLayoutRow[] = []

    // Sort seats by seat number (S1, S2, S3, etc.)
    const sortedSeats = seats.sort((a, b) => {
      const numA = parseInt(a.seat_no.replace(/\D/g, ''))
      const numB = parseInt(b.seat_no.replace(/\D/g, ''))
      return numA - numB
    })

    // Determine seats per row based on bus type
    let seatsPerRow = 4 // Default for regular buses (2+2)
    if (busType.toLowerCase().includes('sleeper') && busType.includes('2+1')) {
      seatsPerRow = 3 // Sleeper buses (2+1)
    }

    // Group seats into rows
    for (let i = 0; i < sortedSeats.length; i += seatsPerRow) {
      const rowSeats = sortedSeats.slice(i, i + seatsPerRow)
      const rowNumber = Math.floor(i / seatsPerRow) + 1

      // Determine seat arrangement based on bus type
      let leftSeats: SeatDetails[] = []
      let rightSeats: SeatDetails[] = []

      if (busType.toLowerCase().includes('sleeper') && busType.includes('2+1')) {
        // Sleeper buses: 2 seats on left, 1 on right
        leftSeats = rowSeats.slice(0, 2)
        rightSeats = rowSeats.slice(2, 3)
      } else {
        // Regular buses: 2+2 arrangement
        leftSeats = rowSeats.slice(0, 2)
        rightSeats = rowSeats.slice(2, 4)
      }

      // Only add rows that have seats
      if (leftSeats.length > 0 || rightSeats.length > 0) {
        layout.push({
          rowNumber,
          leftSeats,
          rightSeats,
          isExit: rowNumber === Math.ceil(sortedSeats.length / seatsPerRow / 2) // Mark middle row as emergency exit
        })
      }
    }

    return layout
  }
}