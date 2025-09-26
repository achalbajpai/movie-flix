import { Router } from 'express'
import { createBookingController } from '@/controllers'

export const createBookingRoutes = (bookingController: ReturnType<typeof createBookingController>): Router => {
  const router = Router()

  // Core booking operations
  router.post('/', bookingController.createBooking)
  router.get('/:id', bookingController.getBookingById)
  router.patch('/:id/status', bookingController.updateBookingStatus)
  router.post('/:id/cancel', bookingController.cancelBooking)

  // User-specific bookings
  router.get('/user/:userId', bookingController.getUserBookings)
  router.get('/user/:userId/upcoming', bookingController.getUpcomingBookings)
  router.get('/user/:userId/past', bookingController.getPastBookings)
  router.get('/user/:userId/cancellable', bookingController.getCancellableBookings)

  // Admin/Analytics endpoints
  router.get('/', bookingController.getAllBookings)
  router.get('/schedule/:scheduleId', bookingController.getBookingsBySchedule)
  router.get('/date-range', bookingController.getBookingsByDateRange)
  router.get('/status/:status', bookingController.getBookingsByStatus)

  // Statistics
  router.get('/stats', bookingController.getBookingStatistics)
  router.get('/revenue/period', bookingController.getRevenueByPeriod)
  router.get('/routes/popular', bookingController.getPopularRoutes)

  // Booking reference and tickets
  router.get('/reference/:reference', bookingController.getBookingByReference)
  router.get('/:id/ticket', bookingController.generateTicket)

  // Booking access and validation
  router.get('/:id/access/:userId', bookingController.checkBookingAccess)
  router.get('/:id/can-cancel/:userId', bookingController.canCancelBooking)
  router.post('/validate', bookingController.validateBooking)

  return router
}