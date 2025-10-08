import { Request, Response } from 'express'
import { ISeatService } from '@/services/interfaces'
import { ResponseBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { validate } from '@/validation'
import { logger } from '@/config'

export const createSeatController = (seatService: ISeatService) => {
  const getSeatsByShow = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const seats = await seatService.getSeatsByShow(showId)

    return res.json(ResponseBuilder.success(seats, 'Seats retrieved successfully'))
  })

  const getAvailableSeats = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    if (showId === undefined || showId === null || isNaN(showId)) {
      throw new Error('Show ID is required and must be a valid number')
    }

    const seats = await seatService.getAvailableSeats(showId)

    return res.json(ResponseBuilder.success(seats, 'Available seats retrieved successfully'))
  })

  const getSeatLayout = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      logger.error('Show ID validation failed for getSeatLayout', {
        errors: validationResult.errors,
        params: req.params
      })

      return res.status(400).json(ResponseBuilder.error({
        code: 'VALIDATION_ERROR',
        message: 'Invalid show ID parameter',
        details: validationResult.errors
      }))
    }
    const { showId } = validationResult.data as any

    const layout = await seatService.getSeatLayout(showId)

    return res.json(ResponseBuilder.success(layout, 'Seat layout retrieved successfully'))
  })

  const checkSeatAvailability = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const seatValidationResult = validate.seatIds(req.body)
    if (!seatValidationResult.success || !seatValidationResult.data) {
      throw new Error('Invalid seat IDs')
    }
    const { seatIds } = seatValidationResult.data as any

    const availability = await seatService.checkSeatAvailability(showId, seatIds)

    return res.json(ResponseBuilder.success(availability, 'Seat availability checked successfully'))
  })

  const calculateSeatPrices = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const seatValidationResult = validate.seatIds(req.body)
    if (!seatValidationResult.success || !seatValidationResult.data) {
      throw new Error('Invalid seat IDs')
    }
    const { seatIds } = seatValidationResult.data as any

    const pricing = await seatService.calculateSeatPrices(showId, seatIds)

    return res.json(ResponseBuilder.success(pricing, 'Seat prices calculated successfully'))
  })

  const validateSeatSelection = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const seatValidationResult = validate.seatIds(req.body)
    if (!seatValidationResult.success || !seatValidationResult.data) {
      throw new Error('Invalid seat IDs')
    }
    const { seatIds } = seatValidationResult.data as any

    const validation = await seatService.validateSeatSelection(showId, seatIds)

    return res.json(ResponseBuilder.success(validation, 'Seat selection validated successfully'))
  })

  const createSeatReservation = asyncHandler(async (req: Request, res: Response) => {
    console.log('=== RESERVATION REQUEST ===')
    console.log('Body:', JSON.stringify(req.body, null, 2))

    const validationResult = validate.seatReservation(req.body)

    if (!validationResult.success || !validationResult.data) {
      console.log('VALIDATION FAILED:', JSON.stringify(validationResult.errors, null, 2))

      return res.status(400).json(ResponseBuilder.error({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed: ' + JSON.stringify(validationResult.errors),
        details: validationResult.errors
      }))
    }

    console.log('Validation passed, creating reservation...')
    const reservation = await seatService.createSeatReservation(validationResult.data as any)
    res.status(201).json(ResponseBuilder.success(reservation, 'Seat reservation created successfully'))
  })

  const getSeatReservation = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.reservationId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid reservation ID parameter')
    }
    const { reservationId } = validationResult.data as any

    const reservation = await seatService.getSeatReservation(reservationId)

    if (!reservation) {
      return res.status(404).json(ResponseBuilder.error({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Reservation not found'
      }))
    }

    return res.json(ResponseBuilder.success(reservation, 'Reservation retrieved successfully'))
  })

  const getUserReservations = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.userId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid user ID parameter')
    }
    const { userId } = validationResult.data as any

    const reservations = await seatService.getUserReservations(userId)

    return res.json(ResponseBuilder.success(reservations, 'User reservations retrieved successfully'))
  })

  const extendReservation = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.reservationId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid reservation ID parameter')
    }
    const { reservationId } = validationResult.data as any

    const minutesValidationResult = validate.extensionMinutes(req.body)
    if (!minutesValidationResult.success || !minutesValidationResult.data) {
      throw new Error('Invalid extension minutes')
    }
    const { additionalMinutes } = minutesValidationResult.data as any

    const reservation = await seatService.extendReservation(reservationId, additionalMinutes)

    return res.json(ResponseBuilder.success(reservation, 'Reservation extended successfully'))
  })

  const cancelReservation = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.reservationId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid reservation ID parameter')
    }
    const { reservationId } = validationResult.data as any

    await seatService.cancelReservation(reservationId)

    return res.json(ResponseBuilder.success(null, 'Reservation cancelled successfully'))
  })

  const getReservationTimeRemaining = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.reservationId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid reservation ID parameter')
    }
    const { reservationId } = validationResult.data as any

    const timeRemaining = await seatService.getReservationTimeRemaining(reservationId)

    return res.json(ResponseBuilder.success({ timeRemaining }, 'Time remaining retrieved successfully'))
  })

  const getSeatById = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.seatId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid seat ID parameter')
    }
    const { id } = validationResult.data as any

    const seat = await seatService.getSeatById(id)

    if (!seat) {
      return res.status(404).json(ResponseBuilder.error({
        code: 'SEAT_NOT_FOUND',
        message: 'Seat not found'
      }))
    }

    return res.json(ResponseBuilder.success(seat, 'Seat retrieved successfully'))
  })

  const getSeatsByIds = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.seatIds(req.body)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid seat IDs')
    }
    const { seatIds } = validationResult.data as any

    const seats = await seatService.getSeatsByIds(seatIds)

    return res.json(ResponseBuilder.success(seats, 'Seats retrieved successfully'))
  })

  const getSeatByNumber = asyncHandler(async (req: Request, res: Response) => {
    const scheduleValidationResult = validate.showId(req.params)
    if (!scheduleValidationResult.success || !scheduleValidationResult.data) {
      throw new Error('Invalid parameters')
    }

    const seatValidationResult = validate.seatNumber(req.params)
    if (!seatValidationResult.success || !seatValidationResult.data) {
      throw new Error('Invalid parameters')
    }

    const { showId } = scheduleValidationResult.data as any
    const { seatNumber } = seatValidationResult.data as any as any

    const seat = await seatService.getSeatByNumber(showId, seatNumber)

    if (!seat) {
      return res.status(404).json(ResponseBuilder.error({
        code: 'SEAT_NOT_FOUND',
        message: 'Seat not found'
      }))
    }

    return res.json(ResponseBuilder.success(seat, 'Seat retrieved successfully'))
  })

  const getBookedSeatsByShow = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const seats = await seatService.getBookedSeatsByShow(showId)

    return res.json(ResponseBuilder.success(seats, 'Booked seats retrieved successfully'))
  })

  const getSeatsByBooking = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid booking ID parameter')
    }
    const { id } = validationResult.data as any

    const seats = await seatService.getSeatsByBooking(id)

    return res.json(ResponseBuilder.success(seats, 'Booking seats retrieved successfully'))
  })

  const getSeatOccupancyRate = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const occupancyRate = await seatService.getSeatOccupancyRate(showId)

    return res.json(ResponseBuilder.success({ occupancyRate }, 'Occupancy rate retrieved successfully'))
  })

  const getPopularSeats = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const popularSeats = await seatService.getPopularSeats(showId)

    return res.json(ResponseBuilder.success(popularSeats, 'Popular seats retrieved successfully'))
  })

  const getSeatRevenue = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const revenue = await seatService.getSeatRevenue(showId)

    return res.json(ResponseBuilder.success({ revenue }, 'Seat revenue retrieved successfully'))
  })

  const updateSeatStatus = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.seatId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid seat ID parameter')
    }
    const { id } = validationResult.data as any

    const statusValidationResult = validate.seatStatus(req.body)
    if (!statusValidationResult.success || !statusValidationResult.data) {
      throw new Error('Invalid seat status')
    }
    const { status } = statusValidationResult.data as any

    const seat = await seatService.updateSeatStatus(id, status)

    return res.json(ResponseBuilder.success(seat, 'Seat status updated successfully'))
  })

  const bulkUpdateSeatStatus = asyncHandler(async (req: Request, res: Response) => {
    const seatValidationResult = validate.seatIds(req.body)
    if (!seatValidationResult.success || !seatValidationResult.data) {
      throw new Error('Invalid seat IDs or status')
    }

    const statusValidationResult = validate.seatStatus(req.body)
    if (!statusValidationResult.success || !statusValidationResult.data) {
      throw new Error('Invalid seat IDs or status')
    }

    const { seatIds } = seatValidationResult.data as any
    const { status } = statusValidationResult.data as any

    const seats = await seatService.bulkUpdateSeatStatus(seatIds, status)

    return res.json(ResponseBuilder.success(seats, 'Seat statuses updated successfully'))
  })

  const cleanupExpiredReservations = asyncHandler(async (req: Request, res: Response) => {
    const result = await seatService.cleanupExpiredReservations()

    return res.json(ResponseBuilder.success(result, 'Expired reservations cleaned up successfully'))
  })

  const validateSeatLayout = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const validation = await seatService.validateSeatLayout(showId)

    return res.json(ResponseBuilder.success(validation, 'Seat layout validated successfully'))
  })

  return {
    getSeatsByShow,
    getAvailableSeats,
    getSeatLayout,
    checkSeatAvailability,
    calculateSeatPrices,
    validateSeatSelection,
    createSeatReservation,
    getSeatReservation,
    getUserReservations,
    extendReservation,
    cancelReservation,
    getReservationTimeRemaining,
    getSeatById,
    getSeatsByIds,
    getSeatByNumber,
    getBookedSeatsByShow,
    getSeatsByBooking,
    getSeatOccupancyRate,
    getPopularSeats,
    getSeatRevenue,
    updateSeatStatus,
    bulkUpdateSeatStatus,
    cleanupExpiredReservations,
    validateSeatLayout
  }
}