import {
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus
} from '@/models'

export interface ISeatService {
  // Seat availability operations
  getSeatsBySchedule(scheduleId: number): Promise<SeatDetails[]>
  getAvailableSeats(scheduleId: number): Promise<SeatDetails[]>
  getSeatLayout(scheduleId: number): Promise<SeatLayout>
  checkSeatAvailability(scheduleId: number, seatIds: number[]): Promise<{
    available: boolean
    unavailableSeats: number[]
    conflictReason: string[]
  }>

  // Seat selection and pricing
  calculateSeatPrices(scheduleId: number, seatIds: number[]): Promise<{
    totalPrice: number
    seatPrices: Array<{ seatId: number; price: number; seatNo: string }>
  }>
  validateSeatSelection(scheduleId: number, seatIds: number[]): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>

  // Seat reservation operations (temporary holds)
  createSeatReservation(reservationData: SeatReservationRequest): Promise<SeatReservation>
  getSeatReservation(reservationId: string): Promise<SeatReservation | null>
  getUserReservations(userId: string): Promise<SeatReservation[]>
  extendReservation(reservationId: string, additionalMinutes: number): Promise<SeatReservation>
  cancelReservation(reservationId: string): Promise<void>
  getReservationTimeRemaining(reservationId: string): Promise<number> // Returns minutes remaining

  // Seat status management
  markSeatsAsBooked(seatIds: number[], bookingId: number): Promise<void>
  releaseSeats(seatIds: number[]): Promise<void>
  updateSeatStatus(seatId: number, status: SeatStatus): Promise<SeatDetails>
  bulkUpdateSeatStatus(seatIds: number[], status: SeatStatus): Promise<SeatDetails[]>

  // Seat queries
  getSeatById(seatId: number): Promise<SeatDetails | null>
  getSeatsByIds(seatIds: number[]): Promise<SeatDetails[]>
  getSeatByNumber(scheduleId: number, seatNumber: string): Promise<SeatDetails | null>
  getBookedSeatsBySchedule(scheduleId: number): Promise<SeatDetails[]>
  getSeatsByBooking(bookingId: number): Promise<SeatDetails[]>

  // Seat analytics and insights
  getSeatOccupancyRate(scheduleId: number): Promise<number>
  getPopularSeats(scheduleId: number): Promise<Array<{ seatNo: string; bookingCount: number }>>
  getSeatRevenue(scheduleId: number): Promise<number>

  // Maintenance and cleanup operations
  cleanupExpiredReservations(): Promise<{ cleanedCount: number; message: string }>
  validateSeatLayout(scheduleId: number): Promise<{ valid: boolean; issues: string[] }>

  // Real-time seat updates (for WebSocket/SSE integration)
  subscribeSeatUpdates(scheduleId: number, callback: (updates: SeatDetails[]) => void): void
  unsubscribeSeatUpdates(scheduleId: number): void
  broadcastSeatUpdate(scheduleId: number, seatIds: number[]): Promise<void>
}