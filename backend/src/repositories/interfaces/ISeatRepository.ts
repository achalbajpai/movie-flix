import {
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus
} from '@/models'
import { PoolClient } from 'pg'

export interface ISeatRepository {
  // Seat availability operations
  findByShowId(showId: number): Promise<SeatDetails[]>
  findAvailableSeats(showId: number): Promise<SeatDetails[]>
  getSeatLayout(showId: number): Promise<SeatLayout>
  checkSeatAvailability(showId: number, seatIds: number[]): Promise<boolean>
  checkDetailedSeatAvailability(showId: number, seatIds: number[]): Promise<{
    available: boolean
    unavailableSeats: Array<{
      seatId: number
      seatNo: string
      reason: 'booked' | 'reserved' | 'not_found'
      reservationExpiresAt?: string
    }>
  }>

  // Transaction-aware seat locking and validation
  lockAndValidateSeats(
    client: PoolClient,
    showId: number,
    seatIds: number[]
  ): Promise<{ valid: boolean; seats: any[]; errors: string[] }>

  // Seat status management
  updateSeatStatus(seatId: number, status: SeatStatus): Promise<SeatDetails>
  updateMultipleSeatStatus(seatIds: number[], status: SeatStatus): Promise<SeatDetails[]>
  markSeatsAsBooked(seatIds: number[], bookingId: number): Promise<void>

  // Transaction-aware seat booking
  markSeatsAsBookedWithTransaction(
    client: PoolClient,
    seatIds: number[],
    bookingId: number
  ): Promise<void>

  releaseSeats(seatIds: number[]): Promise<void>

  // Seat reservation operations (temporary holds)
  createReservation(reservationData: SeatReservationRequest): Promise<SeatReservation>
  findReservation(reservationId: string): Promise<SeatReservation | null>
  findReservationsByUser(userId: string): Promise<SeatReservation[]>
  extendReservation(reservationId: string, expiresAt: string): Promise<SeatReservation>
  cancelReservation(reservationId: string): Promise<void>
  cleanupExpiredReservations(): Promise<void>

  // Seat queries
  findSeatById(seatId: number): Promise<SeatDetails | null>
  findSeatsByIds(seatIds: number[]): Promise<SeatDetails[]>
  findSeatByNumber(showId: number, seatNumber: string): Promise<SeatDetails | null>

  // Seat pricing
  calculateSeatPrices(showId: number, seatIds: number[]): Promise<number>

  // Transaction-aware price calculation
  calculateSeatPricesWithTransaction(
    client: PoolClient,
    showId: number,
    seatIds: number[]
  ): Promise<number>

  getSeatPrice(seatId: number): Promise<number>

  // Booking integration
  findBookedSeatsByShow(showId: number): Promise<SeatDetails[]>
  findSeatsByBookingId(bookingId: number): Promise<SeatDetails[]>

  // Analytics
  getSeatOccupancyRate(showId: number): Promise<number>
  getPopularSeats(showId: number): Promise<Array<{ seatNo: string; bookingCount: number }>>
}