import { supabase } from '@/config/supabase'
import { logger } from '@/config'
import { PoolClient } from 'pg'
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

  async findByShowId(showId: number): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('show_id', showId)
        .order('seat_no')

      if (error) throw new Error(`Failed to find seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding seats by schedule ID', { error: (error as Error).message, showId })
      throw error
    }
  }

  async findAvailableSeats(showId: number): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('show_id', showId)
        .eq('is_reserved', false)
        .order('seat_no')

      if (error) throw new Error(`Failed to find available seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding available seats', { error: (error as Error).message, showId })
      throw error
    }
  }

  async getSeatLayout(showId: number): Promise<SeatLayout> {
    try {
      // Get show and screen information
      const { data: show, error: showError } = await supabase
        .from('show')
        .select(`
          *,
          screen (
            screen_id,
            screen_type,
            total_seats,
            rows,
            columns
          )
        `)
        .eq('show_id', showId)
        .maybeSingle()

      if (showError) throw new Error(`Failed to get show: ${showError.message}`)

      if (!show) {
        throw new Error(`Show with ID ${showId} not found`)
      }

      // Get all seats for this show
      const seats = await this.findByShowId(showId)

      // Get screen details
      const screenType = show.Screen?.screen_type || 'Regular'
      const totalSeats = show.Screen?.total_seats || seats.length
      const rows = show.Screen?.rows || 10
      const columns = show.Screen?.columns || 15

      // Create seat layout based on screen type
      const layout = this.createSeatLayout(seats, screenType, rows, columns)

      return {
        totalSeats,
        rows,
        columns,
        layout,
        screenType
      }

    } catch (error) {
      logger.error('Error getting seat layout', { error: (error as Error).message, showId })
      throw error
    }
  }

  async checkSeatAvailability(showId: number, seatIds: number[]): Promise<boolean> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('seat_id, is_reserved, reservation_expires_at')
        .eq('show_id', showId)
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
      logger.error('Error checking seat availability', { error: (error as Error).message, showId, seatIds })
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
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
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
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
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
      const isAvailable = await this.checkSeatAvailability(reservationData.showId, reservationData.seatIds)
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
          show_id: reservationData.showId,
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
        show_id: reservation.show_id,
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
        show_id: reservation.show_id,
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
        show_id: reservation.show_id,
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
        show_id: reservation.show_id,
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
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
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
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
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

  async findSeatByNumber(showId: number, seatNumber: string): Promise<SeatDetails | null> {
    try {
      const { data: seat, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('show_id', showId)
        .eq('seat_no', seatNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw new Error(`Failed to find seat: ${error.message}`)
      }

      return {
        seat_id: seat.seat_id,
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      }

    } catch (error) {
      logger.error('Error finding seat by number', { error: (error as Error).message, showId, seatNumber })
      throw error
    }
  }

  async calculateSeatPrices(showId: number, seatIds: number[]): Promise<number> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('price')
        .eq('show_id', showId)
        .in('seat_id', seatIds)

      if (error) throw new Error(`Failed to calculate seat prices: ${error.message}`)

      return seats?.reduce((total, seat) => total + (seat.price || 0), 0) || 0

    } catch (error) {
      logger.error('Error calculating seat prices', { error: (error as Error).message, showId, seatIds })
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

  async findBookedSeatsByShow(showId: number): Promise<SeatDetails[]> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('*')
        .eq('show_id', showId)
        .eq('is_reserved', true)
        .order('seat_no')

      if (error) throw new Error(`Failed to find booked seats: ${error.message}`)

      return seats?.map(seat => ({
        seat_id: seat.seat_id,
        row_number: seat.row_number,
        column_number: seat.column_number,
        seat_type: seat.seat_type,
        show_id: seat.show_id,
        seat_no: seat.seat_no,
        is_reserved: seat.is_reserved,
        price: seat.price,
        reservation_expires_at: seat.reservation_expires_at
      })) || []

    } catch (error) {
      logger.error('Error finding booked seats by schedule', { error: (error as Error).message, showId })
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
        row_number: bs.Seat.row_number,
        column_number: bs.Seat.column_number,
        seat_type: bs.Seat.seat_type,
        show_id: bs.Seat.show_id,
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

  async getSeatOccupancyRate(showId: number): Promise<number> {
    try {
      const { data: seats, error } = await supabase
        .from('Seat')
        .select('is_reserved')
        .eq('show_id', showId)

      if (error) throw new Error(`Failed to get seat occupancy rate: ${error.message}`)

      if (!seats || seats.length === 0) return 0

      const bookedSeats = seats.filter(seat => seat.is_reserved).length
      return (bookedSeats / seats.length) * 100

    } catch (error) {
      logger.error('Error getting seat occupancy rate', { error: (error as Error).message, showId })
      throw error
    }
  }

  async getPopularSeats(showId: number): Promise<Array<{ seatNo: string; bookingCount: number }>> {
    try {
      const { data: seatBookings, error } = await supabase
        .from('Booking_seat')
        .select(`
          Seat (seat_no)
        `)
        .eq('Booking.show_id', showId)

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
      logger.error('Error getting popular seats', { error: (error as Error).message, showId })
      throw error
    }
  }


  async lockAndValidateSeats(
    client: PoolClient,
    showId: number,
    seatIds: number[]
  ): Promise<{ valid: boolean; seats: any[]; errors: string[] }> {
    try {
      const result = await client.query(
        `SELECT seat_id, seat_no, is_reserved, reservation_expires_at, price
         FROM public."Seat"
         WHERE show_id = $1 AND seat_id = ANY($2::bigint[])
         FOR UPDATE NOWAIT`,
        [showId, seatIds]
      )

      const seats = result.rows
      const errors: string[] = []

      if (seats.length !== seatIds.length) {
        errors.push('Some seats do not exist for this show')
      }

      const now = new Date()
      for (const seat of seats) {
        if (seat.is_reserved) {
          if (!seat.reservation_expires_at || new Date(seat.reservation_expires_at) > now) {
            errors.push(`Seat ${seat.seat_no} is already booked`)
          }
        }
      }

      return {
        valid: errors.length === 0,
        seats,
        errors
      }
    } catch (error: any) {
      if (error.code === '55P03') { 
        return {
          valid: false,
          seats: [],
          errors: ['Seats are currently being booked by another user']
        }
      }
      logger.error('Error locking seats', { error: error.message, showId, seatIds })
      throw error
    }
  }


  async markSeatsAsBookedWithTransaction(
    client: PoolClient,
    seatIds: number[],
    bookingId: number
  ): Promise<void> {
    try {
      await client.query(
        `UPDATE public."Seat"
         SET is_reserved = true,
             booking_id = $1,
             reservation_expires_at = NULL,
             version = version + 1,
             updated_at = NOW()
         WHERE seat_id = ANY($2::bigint[])`,
        [bookingId, seatIds]
      )
    } catch (error) {
      logger.error('Error marking seats as booked', { error: (error as Error).message, seatIds, bookingId })
      throw error
    }
  }

  async calculateSeatPricesWithTransaction(
    client: PoolClient,
    showId: number,
    seatIds: number[]
  ): Promise<number> {
    try {
      const result = await client.query(
        `SELECT SUM(price) as total
         FROM public."Seat"
         WHERE show_id = $1 AND seat_id = ANY($2::bigint[])`,
        [showId, seatIds]
      )

      return parseFloat(result.rows[0]?.total || '0')
    } catch (error) {
      logger.error('Error calculating seat prices', { error: (error as Error).message, showId, seatIds })
      throw error
    }
  }

  private createSeatLayout(seats: SeatDetails[], screenType: string, rows: number, columns: number): SeatLayoutRow[] {
    // Create theater-style seat layout
    const layout: SeatLayoutRow[] = []

    // Group seats by row letter (A, B, C, etc.)
    const seatsByRow = new Map<string, SeatDetails[]>()

    seats.forEach(seat => {
      // Extract row letter from seat_no (e.g., A1, B12, etc.)
      const rowLetter = seat.row_number || seat.seat_no.charAt(0)
      if (!seatsByRow.has(rowLetter)) {
        seatsByRow.set(rowLetter, [])
      }
      seatsByRow.get(rowLetter)!.push(seat)
    })

    // Create layout rows
    const rowLetters = Array.from(seatsByRow.keys()).sort()
    rowLetters.forEach((rowLetter, index) => {
      const rowSeats = seatsByRow.get(rowLetter) || []

      // Sort seats by column number
      rowSeats.sort((a, b) => {
        const colA = a.column_number || parseInt(a.seat_no.replace(/\D/g, ''))
        const colB = b.column_number || parseInt(b.seat_no.replace(/\D/g, ''))
        return colA - colB
      })

      // Split seats into left and right sections for theater layout
      // Typically split at middle with an aisle
      const midPoint = Math.ceil(rowSeats.length / 2)
      const leftSeats = rowSeats.slice(0, midPoint)
      const rightSeats = rowSeats.slice(midPoint)

      layout.push({
        rowLetter,
        rowNumber: index + 1,
        leftSeats,
        rightSeats,
        isExit: index === Math.floor(rows / 2), // Mark middle row as exit
        seats: rowSeats // Keep for backward compatibility
      } as any)
    })

    return layout
  }
}