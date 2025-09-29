import { Router } from 'express'
import { createBookingController } from '@/controllers'
import { authenticateUser, optionalAuth } from '@/middleware'

export const createBookingRoutes = (bookingController: ReturnType<typeof createBookingController>): Router => {
  const router = Router()

  // Core booking operations - require authentication
  router.post('/', authenticateUser, bookingController.createBooking)
  router.get('/:id', authenticateUser, bookingController.getBookingById)
  router.patch('/:id/status', authenticateUser, bookingController.updateBookingStatus)
  router.post('/:id/cancel', authenticateUser, bookingController.cancelBooking)

  // User-specific bookings - require authentication
  router.get('/user/:userId', authenticateUser, bookingController.getUserBookings)
  router.get('/user/:userId/upcoming', authenticateUser, bookingController.getUpcomingBookings)
  router.get('/user/:userId/past', authenticateUser, bookingController.getPastBookings)
  router.get('/user/:userId/cancellable', authenticateUser, bookingController.getCancellableBookings)

  // Admin/Analytics endpoints - require authentication (these would typically require admin role)
  router.get('/', authenticateUser, bookingController.getAllBookings)
  router.get('/schedule/:scheduleId', authenticateUser, bookingController.getBookingsBySchedule)
  router.get('/date-range', authenticateUser, bookingController.getBookingsByDateRange)
  router.get('/status/:status', authenticateUser, bookingController.getBookingsByStatus)

  // Statistics - require authentication
  router.get('/stats', authenticateUser, bookingController.getBookingStatistics)
  router.get('/revenue/period', authenticateUser, bookingController.getRevenueByPeriod)
  router.get('/routes/popular', authenticateUser, bookingController.getPopularRoutes)

  // Booking reference and tickets - require authentication
  router.get('/reference/:reference', authenticateUser, bookingController.getBookingByReference)
  router.get('/:id/ticket', authenticateUser, bookingController.generateTicket)

  // Booking access and validation - require authentication
  router.get('/:id/access/:userId', authenticateUser, bookingController.checkBookingAccess)
  router.get('/:id/can-cancel/:userId', authenticateUser, bookingController.canCancelBooking)
  router.post('/validate', authenticateUser, bookingController.validateBooking)

  return router
}