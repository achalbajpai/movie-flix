import { Router } from 'express'
import { createSeatController } from '@/controllers'

export const createSeatRoutes = (seatController: ReturnType<typeof createSeatController>): Router => {
  const router = Router()

  // Seat queries by schedule
  router.get('/schedule/:scheduleId', seatController.getSeatsBySchedule)
  router.get('/schedule/:scheduleId/available', seatController.getAvailableSeats)
  router.get('/schedule/:scheduleId/layout', seatController.getSeatLayout)
  router.get('/schedule/:scheduleId/booked', seatController.getBookedSeatsBySchedule)
  router.get('/schedule/:scheduleId/seat/:seatNumber', seatController.getSeatByNumber)

  // Seat availability and validation
  router.post('/schedule/:scheduleId/check-availability', seatController.checkSeatAvailability)
  router.post('/schedule/:scheduleId/calculate-prices', seatController.calculateSeatPrices)
  router.post('/schedule/:scheduleId/validate-selection', seatController.validateSeatSelection)

  // Individual seat operations
  router.get('/:id', seatController.getSeatById)
  router.post('/by-ids', seatController.getSeatsByIds)
  router.patch('/:id/status', seatController.updateSeatStatus)
  router.patch('/bulk-update-status', seatController.bulkUpdateSeatStatus)

  // Seat reservations (temporary holds)
  router.post('/reservations', seatController.createSeatReservation)
  router.get('/reservations/:reservationId', seatController.getSeatReservation)
  router.get('/reservations/user/:userId', seatController.getUserReservations)
  router.patch('/reservations/:reservationId/extend', seatController.extendReservation)
  router.delete('/reservations/:reservationId', seatController.cancelReservation)
  router.get('/reservations/:reservationId/time-remaining', seatController.getReservationTimeRemaining)

  // Booking-related seat operations
  router.get('/booking/:bookingId', seatController.getSeatsByBooking)

  // Analytics and statistics
  router.get('/schedule/:scheduleId/occupancy-rate', seatController.getSeatOccupancyRate)
  router.get('/schedule/:scheduleId/popular', seatController.getPopularSeats)
  router.get('/schedule/:scheduleId/revenue', seatController.getSeatRevenue)

  // Maintenance operations
  router.post('/cleanup-expired-reservations', seatController.cleanupExpiredReservations)
  router.get('/schedule/:scheduleId/validate-layout', seatController.validateSeatLayout)

  return router
}