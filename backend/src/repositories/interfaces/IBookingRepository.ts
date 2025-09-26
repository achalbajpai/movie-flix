import {
  BookingResponse,
  BookingQuery,
  CreateBookingData,
  BookingStatistics,
  BookingHistory,
  CancelBookingRequest,
  BookingStatus
} from '@/models'

export interface IBookingRepository {
  // Core booking operations
  create(bookingData: CreateBookingData): Promise<BookingResponse>
  findById(bookingId: number): Promise<BookingResponse | null>
  findByUserId(userId: string, query?: Partial<BookingQuery>): Promise<BookingHistory>
  updateStatus(bookingId: number, status: BookingStatus): Promise<BookingResponse>
  cancel(bookingId: number, cancelData: CancelBookingRequest): Promise<BookingResponse>

  // Booking queries
  findAll(query?: BookingQuery): Promise<BookingHistory>
  findByScheduleId(scheduleId: number): Promise<BookingResponse[]>
  findByDateRange(fromDate: string, toDate: string): Promise<BookingResponse[]>
  findByStatus(status: BookingStatus): Promise<BookingResponse[]>

  // Statistics and analytics
  getBookingStatistics(): Promise<BookingStatistics>
  getRevenueByPeriod(startDate: string, endDate: string): Promise<Array<{ period: string; revenue: number }>>
  getPopularRoutes(limit?: number): Promise<Array<{ route: string; bookings: number }>>

  // Validation helpers
  checkBookingExists(bookingId: number): Promise<boolean>
  checkUserBookingAccess(bookingId: number, userId: string): Promise<boolean>
  getBookingsByReference(reference: string): Promise<BookingResponse[]>

  // Advanced queries
  findUpcomingBookings(userId: string): Promise<BookingResponse[]>
  findPastBookings(userId: string): Promise<BookingResponse[]>
  findCancellableBookings(userId: string): Promise<BookingResponse[]>
}