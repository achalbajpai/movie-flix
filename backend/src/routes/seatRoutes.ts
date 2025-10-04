import { Router } from 'express'
import { createSeatController } from '@/controllers'
import { authenticateUser, optionalAuth } from '@/middleware'

export const createSeatRoutes = (seatController: ReturnType<typeof createSeatController>): Router => {
  const router = Router()

  // Seat queries by show - require authentication for seat selection
  router.get('/show/:showId', authenticateUser, seatController.getSeatsByShow)
  router.get('/show/:showId/available', authenticateUser, seatController.getAvailableSeats)
  router.get('/show/:showId/layout', authenticateUser, seatController.getSeatLayout)
  router.get('/show/:showId/booked', authenticateUser, seatController.getBookedSeatsByShow)
  router.get('/show/:showId/seat/:seatNumber', authenticateUser, seatController.getSeatByNumber)

  // Seat availability and validation - require authentication
  router.post('/show/:showId/check-availability', authenticateUser, seatController.checkSeatAvailability)
  router.post('/show/:showId/calculate-prices', authenticateUser, seatController.calculateSeatPrices)
  router.post('/show/:showId/validate-selection', authenticateUser, seatController.validateSeatSelection)

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
  router.get('/show/:showId/occupancy-rate', authenticateUser, seatController.getSeatOccupancyRate)
  router.get('/show/:showId/popular', authenticateUser, seatController.getPopularSeats)
  router.get('/show/:showId/revenue', authenticateUser, seatController.getSeatRevenue)

  // Maintenance operations - require authentication (admin only typically)
  router.post('/cleanup-expired-reservations', authenticateUser, seatController.cleanupExpiredReservations)
  router.get('/show/:showId/validate-layout', authenticateUser, seatController.validateSeatLayout)

  return router
}