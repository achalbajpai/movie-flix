import {
  BookingResponse,
  BookingQuery,
  CreateBookingData,
  BookingStatistics,
  BookingHistory,
  CancelBookingRequest,
  BookingStatus,
  BookingConfirmation
} from '@/models'

export interface IBookingService {
  // Core booking operations
  createBooking(bookingData: CreateBookingData): Promise<BookingConfirmation>
  getBookingById(bookingId: number): Promise<BookingResponse | null>
  getUserBookings(userId: string, query?: Partial<BookingQuery>): Promise<BookingHistory>
  updateBookingStatus(bookingId: number, status: BookingStatus): Promise<BookingResponse>
  cancelBooking(bookingId: number, userId: string, cancelData?: CancelBookingRequest): Promise<BookingResponse>

  // Booking queries and searches
  getAllBookings(query?: BookingQuery): Promise<BookingHistory>
  getBookingsBySchedule(scheduleId: number): Promise<BookingResponse[]>
  getBookingsByDateRange(fromDate: string, toDate: string): Promise<BookingResponse[]>
  getBookingsByStatus(status: BookingStatus): Promise<BookingResponse[]>

  // User-specific booking operations
  getUpcomingBookings(userId: string): Promise<BookingResponse[]>
  getPastBookings(userId: string): Promise<BookingResponse[]>
  getCancellableBookings(userId: string): Promise<BookingResponse[]>

  // Booking validation and business logic
  validateBookingRequest(bookingData: CreateBookingData): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>
  checkBookingAccess(bookingId: number, userId: string): Promise<boolean>
  canCancelBooking(bookingId: number, userId: string): Promise<boolean>
  calculateRefundAmount(bookingId: number): Promise<number>

  // Statistics and analytics
  getBookingStatistics(): Promise<BookingStatistics>
  getRevenueByPeriod(startDate: string, endDate: string): Promise<Array<{ period: string; revenue: number }>>
  getPopularRoutes(limit?: number): Promise<Array<{ route: string; bookings: number }>>

  // Booking reference operations
  getBookingByReference(reference: string): Promise<BookingResponse | null>
  generateBookingReference(bookingId: number): string

  // Ticket operations
  generateTicket(bookingId: number): Promise<string> // Returns ticket URL or content
  sendBookingConfirmation(bookingId: number): Promise<void>
  sendCancellationNotification(bookingId: number): Promise<void>
}