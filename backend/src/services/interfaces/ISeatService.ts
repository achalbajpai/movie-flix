import {
  SeatDetails,
  SeatLayout,
  SeatReservation,
  SeatReservationRequest,
  SeatStatus
} from '@/models'

export interface ISeatService {
  // Seat availability operations
  getSeatsByShow(showId: number): Promise<SeatDetails[]>
  getAvailableSeats(showId: number): Promise<SeatDetails[]>
  getSeatLayout(showId: number): Promise<SeatLayout>
  checkSeatAvailability(showId: number, seatIds: number[]): Promise<{
    available: boolean
    unavailableSeats: number[]
    conflictReason: string[]
  }>

  // Seat selection and pricing
  calculateSeatPrices(showId: number, seatIds: number[]): Promise<{
    totalPrice: number
    seatPrices: Array<{ seatId: number; price: number; seatNo: string }>
  }>
  validateSeatSelection(showId: number, seatIds: number[]): Promise<{
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
  getSeatByNumber(showId: number, seatNumber: string): Promise<SeatDetails | null>
  getBookedSeatsByShow(showId: number): Promise<SeatDetails[]>
  getSeatsByBooking(bookingId: number): Promise<SeatDetails[]>

  // Seat analytics and insights
  getSeatOccupancyRate(showId: number): Promise<number>
  getPopularSeats(showId: number): Promise<Array<{ seatNo: string; bookingCount: number }>>
  getSeatRevenue(showId: number): Promise<number>

  // Maintenance and cleanup operations
  cleanupExpiredReservations(): Promise<{ cleanedCount: number; message: string }>
  validateSeatLayout(showId: number): Promise<{ valid: boolean; issues: string[] }>

  // Real-time seat updates (for WebSocket/SSE integration)
  subscribeSeatUpdates(showId: number, callback: (updates: SeatDetails[]) => void): void
  unsubscribeSeatUpdates(showId: number): void
  broadcastSeatUpdate(showId: number, seatIds: number[]): Promise<void>
}