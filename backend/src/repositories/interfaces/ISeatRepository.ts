import {
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus
} from '@/models'

export interface ISeatRepository {
  // Seat availability operations
  findByShowId(showId: number): Promise<SeatDetails[]>
  findAvailableSeats(showId: number): Promise<SeatDetails[]>
  getSeatLayout(showId: number): Promise<SeatLayout>
  checkSeatAvailability(showId: number, seatIds: number[]): Promise<boolean>

  // Seat status management
  updateSeatStatus(seatId: number, status: SeatStatus): Promise<SeatDetails>
  updateMultipleSeatStatus(seatIds: number[], status: SeatStatus): Promise<SeatDetails[]>
  markSeatsAsBooked(seatIds: number[], bookingId: number): Promise<void>
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
  getSeatPrice(seatId: number): Promise<number>

  // Booking integration
  findBookedSeatsByShow(showId: number): Promise<SeatDetails[]>
  findSeatsByBookingId(bookingId: number): Promise<SeatDetails[]>

  // Analytics
  getSeatOccupancyRate(showId: number): Promise<number>
  getPopularSeats(showId: number): Promise<Array<{ seatNo: string; bookingCount: number }>>
}