import { Router } from 'express'
import { createSeatController } from '@/controllers'
import { authenticateUser, optionalAuth } from '@/middleware'

export const createSeatRoutes = (seatController: ReturnType<typeof createSeatController>): Router => {
  const router = Router()

  // Seat queries by schedule - require authentication for seat selection
  router.get('/schedule/:scheduleId', authenticateUser, seatController.getSeatsBySchedule)
  router.get('/schedule/:scheduleId/available', authenticateUser, seatController.getAvailableSeats)
  router.get('/schedule/:scheduleId/layout', authenticateUser, seatController.getSeatLayout)
  router.get('/schedule/:scheduleId/booked', authenticateUser, seatController.getBookedSeatsBySchedule)
  router.get('/schedule/:scheduleId/seat/:seatNumber', authenticateUser, seatController.getSeatByNumber)

  // Seat availability and validation - require authentication
  router.post('/schedule/:scheduleId/check-availability', authenticateUser, seatController.checkSeatAvailability)
  router.post('/schedule/:scheduleId/calculate-prices', authenticateUser, seatController.calculateSeatPrices)
  router.post('/schedule/:scheduleId/validate-selection', authenticateUser, seatController.validateSeatSelection)

  // Individual seat operations - require authentication
  router.get('/:id', authenticateUser, seatController.getSeatById)
  router.post('/by-ids', authenticateUser, seatController.getSeatsByIds)
  router.patch('/:id/status', authenticateUser, seatController.updateSeatStatus)
  router.patch('/bulk-update-status', authenticateUser, seatController.bulkUpdateSeatStatus)

  // Seat reservations (temporary holds) - require authentication
  router.post('/reservations', authenticateUser, seatController.createSeatReservation)
  router.get('/reservations/:reservationId', authenticateUser, seatController.getSeatReservation)
  router.get('/reservations/user/:userId', authenticateUser, seatController.getUserReservations)
  router.patch('/reservations/:reservationId/extend', authenticateUser, seatController.extendReservation)
  router.delete('/reservations/:reservationId', authenticateUser, seatController.cancelReservation)
  router.get('/reservations/:reservationId/time-remaining', authenticateUser, seatController.getReservationTimeRemaining)

  // Booking-related seat operations - require authentication
  router.get('/booking/:bookingId', authenticateUser, seatController.getSeatsByBooking)

  // Analytics and statistics - require authentication (admin only typically)
  router.get('/schedule/:scheduleId/occupancy-rate', authenticateUser, seatController.getSeatOccupancyRate)
  router.get('/schedule/:scheduleId/popular', authenticateUser, seatController.getPopularSeats)
  router.get('/schedule/:scheduleId/revenue', authenticateUser, seatController.getSeatRevenue)

  // Maintenance operations - require authentication (admin only typically)
  router.post('/cleanup-expired-reservations', authenticateUser, seatController.cleanupExpiredReservations)
  router.get('/schedule/:scheduleId/validate-layout', authenticateUser, seatController.validateSeatLayout)

  return router
}