import {
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus
} from '@/models'

export interface ISeatRepository {
  // Seat availability operations
  findByScheduleId(scheduleId: number): Promise<SeatDetails[]>
  findAvailableSeats(scheduleId: number): Promise<SeatDetails[]>
  getSeatLayout(scheduleId: number): Promise<SeatLayout>
  checkSeatAvailability(scheduleId: number, seatIds: number[]): Promise<boolean>

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
  findSeatByNumber(scheduleId: number, seatNumber: string): Promise<SeatDetails | null>

  // Seat pricing
  calculateSeatPrices(scheduleId: number, seatIds: number[]): Promise<number>
  getSeatPrice(seatId: number): Promise<number>

  // Booking integration
  findBookedSeatsBySchedule(scheduleId: number): Promise<SeatDetails[]>
  findSeatsByBookingId(bookingId: number): Promise<SeatDetails[]>

  // Analytics
  getSeatOccupancyRate(scheduleId: number): Promise<number>
  getPopularSeats(scheduleId: number): Promise<Array<{ seatNo: string; bookingCount: number }>>
}