import { Request, Response } from 'express'
import { IBookingService } from '@/services/interfaces'
import { ResponseBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { validate } from '@/validation'
import { logger } from '@/config'

export const createBookingController = (bookingService: IBookingService) => {
  const createBooking = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.createBooking(req.body)
    if (!validationResult.success || !validationResult.data) {
      const errorDetails = validationResult.errors?.map(err =>
        `${err.field}: ${err.message}`
      ).join(', ') || 'Unknown validation error'

      logger.error('Booking validation failed', {
        errors: validationResult.errors,
        requestBody: req.body
      })

      return res.status(400).json(ResponseBuilder.error({
        code: 'VALIDATION_ERROR',
        message: 'Booking validation failed',
        details: validationResult.errors
      }))
    }

    // Transform CreateBookingRequest to CreateBookingData format
    const requestData = validationResult.data as any
    const bookingData = {
      userId: requestData.userId,
      showId: requestData.showId,
      seats: requestData.seatIds.map((seatId: number, index: number) => ({
        seatId: seatId,
        customer: requestData.customers[index] || requestData.customers[0] // Use corresponding customer or first customer
      })),
      contactDetails: requestData.contactDetails,
      totalAmount: 0 // Will be calculated in service
    }

    const confirmation = await bookingService.createBooking(bookingData)

    return res.status(201).json(ResponseBuilder.success(confirmation, 'Booking created successfully'))
  })

  const getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingId(req.params)
    if (!validationResult.success || !validationResult.data) {
      logger.error('Booking ID validation failed', {
        errors: validationResult.errors,
        params: req.params
      })

      return res.status(400).json(ResponseBuilder.error({
        code: 'VALIDATION_ERROR',
        message: 'Invalid booking ID parameter',
        details: validationResult.errors
      }))
    }
    const { id } = validationResult.data as any

    const booking = await bookingService.getBookingById(id)

    if (!booking) {
      return res.status(404).json(ResponseBuilder.error({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found'
      }))
    }

    return res.json(ResponseBuilder.success(booking, 'Booking retrieved successfully'))
  })

  const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.userId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid user ID parameter')
    }
    const { userId } = validationResult.data as any

    // Parse query parameters
    const queryValidationResult = validate.bookingQuery(req.query)
    const query = queryValidationResult.success && queryValidationResult.data ? queryValidationResult.data as any : {}

    const bookingHistory = await bookingService.getUserBookings(userId, query)

    const response = ResponseBuilder.paginated(
      bookingHistory.bookings,
      bookingHistory.pagination.currentPage,
      bookingHistory.pagination.limit,
      bookingHistory.pagination.totalItems,
      'User bookings retrieved successfully'
    )

    res.json(response)
  })

  const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid booking ID parameter')
    }
    const { id } = validationResult.data as any

    const statusValidationResult = validate.bookingStatus(req.body)
    if (!statusValidationResult.success || !statusValidationResult.data) {
      throw new Error('Invalid status data')
    }
    const { status } = statusValidationResult.data as any

    const booking = await bookingService.updateBookingStatus(id, status)

    return res.json(ResponseBuilder.success(booking, 'Booking status updated successfully'))
  })

  const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid booking ID parameter')
    }
    const { id } = validationResult.data as any

    const cancelValidationResult = validate.cancelBooking(req.body)
    if (!cancelValidationResult.success || !cancelValidationResult.data) {
      throw new Error('Invalid cancellation data')
    }
    const cancelData = cancelValidationResult.data as any

    const userId = req.body.userId || req.headers['user-id'] as string

    if (!userId) {
      throw new Error('User ID is required')
    }

    const booking = await bookingService.cancelBooking(id, userId, cancelData)

    return res.json(ResponseBuilder.success(booking, 'Booking cancelled successfully'))
  })

  const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
    const queryValidationResult = validate.bookingQuery(req.query)
    const query = queryValidationResult.success && queryValidationResult.data ? queryValidationResult.data as any : {}

    const bookingHistory = await bookingService.getAllBookings(query)

    const response = ResponseBuilder.paginated(
      bookingHistory.bookings,
      bookingHistory.pagination.currentPage,
      bookingHistory.pagination.limit,
      bookingHistory.pagination.totalItems,
      'All bookings retrieved successfully'
    )

    res.json(response)
  })

  const getBookingsByShow = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.showId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid show ID parameter')
    }
    const { showId } = validationResult.data as any

    const bookings = await bookingService.getBookingsByShow(showId)

    return res.json(ResponseBuilder.success(bookings, 'Show bookings retrieved successfully'))
  })

  const getBookingsByDateRange = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.dateRange(req.query)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid date range parameters')
    }
    const { fromDate, toDate } = validationResult.data as any

    const bookings = await bookingService.getBookingsByDateRange(fromDate, toDate)

    return res.json(ResponseBuilder.success(bookings, 'Bookings by date range retrieved successfully'))
  })

  const getBookingsByStatus = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingStatusParam(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid status parameter')
    }
    const { status } = validationResult.data as any

    const bookings = await bookingService.getBookingsByStatus(status)

    return res.json(ResponseBuilder.success(bookings, 'Bookings by status retrieved successfully'))
  })

  const getUpcomingBookings = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.userId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid user ID parameter')
    }
    const { userId } = validationResult.data as any

    const bookings = await bookingService.getUpcomingBookings(userId)

    return res.json(ResponseBuilder.success(bookings, 'Upcoming bookings retrieved successfully'))
  })

  const getPastBookings = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.userId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid user ID parameter')
    }
    const { userId } = validationResult.data as any

    const bookings = await bookingService.getPastBookings(userId)

    return res.json(ResponseBuilder.success(bookings, 'Past bookings retrieved successfully'))
  })

  const getCancellableBookings = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.userId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid user ID parameter')
    }
    const { userId } = validationResult.data as any

    const bookings = await bookingService.getCancellableBookings(userId)

    return res.json(ResponseBuilder.success(bookings, 'Cancellable bookings retrieved successfully'))
  })

  const getBookingStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await bookingService.getBookingStatistics()

    return res.json(ResponseBuilder.success(stats, 'Booking statistics retrieved successfully'))
  })

  const getRevenueByPeriod = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.dateRange(req.query)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid date range parameters')
    }
    const { fromDate, toDate } = validationResult.data as any

    const revenue = await bookingService.getRevenueByPeriod(fromDate, toDate)

    return res.json(ResponseBuilder.success(revenue, 'Revenue by period retrieved successfully'))
  })

  const getPopularMovies = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

    const movies = await bookingService.getPopularMovies(limit)

    return res.json(ResponseBuilder.success(movies, 'Popular movies retrieved successfully'))
  })

  const getBookingByReference = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingReference(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid booking reference parameter')
    }
    const { reference } = validationResult.data as any

    const booking = await bookingService.getBookingByReference(reference)

    if (!booking) {
      return res.status(404).json(ResponseBuilder.error({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found'
      }))
    }

    return res.json(ResponseBuilder.success(booking, 'Booking retrieved successfully'))
  })

  const generateTicket = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.bookingId(req.params)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid booking ID parameter')
    }
    const { id } = validationResult.data as any

    const ticketUrl = await bookingService.generateTicket(id)

    return res.json(ResponseBuilder.success({ ticketUrl }, 'Ticket generated successfully'))
  })

  const checkBookingAccess = asyncHandler(async (req: Request, res: Response) => {
    const bookingValidationResult = validate.bookingId(req.params)
    if (!bookingValidationResult.success || !bookingValidationResult.data) {
      throw new Error('Invalid parameters')
    }

    const userValidationResult = validate.userId(req.params)
    if (!userValidationResult.success || !userValidationResult.data) {
      throw new Error('Invalid parameters')
    }

    const { id } = bookingValidationResult.data as any
    const { userId } = userValidationResult.data as any

    const hasAccess = await bookingService.checkBookingAccess(id, userId)

    return res.json(ResponseBuilder.success({ hasAccess }, 'Booking access checked successfully'))
  })

  const canCancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingValidationResult = validate.bookingId(req.params)
    if (!bookingValidationResult.success || !bookingValidationResult.data) {
      throw new Error('Invalid parameters')
    }

    const userValidationResult = validate.userId(req.params)
    if (!userValidationResult.success || !userValidationResult.data) {
      throw new Error('Invalid parameters')
    }

    const { id } = bookingValidationResult.data as any
    const { userId } = userValidationResult.data as any

    const canCancel = await bookingService.canCancelBooking(id, userId)
    const refundAmount = canCancel ? await bookingService.calculateRefundAmount(id) : 0

    return res.json(ResponseBuilder.success({ canCancel, refundAmount }, 'Cancellation status checked successfully'))
  })

  const validateBooking = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = validate.createBooking(req.body)
    if (!validationResult.success || !validationResult.data) {
      throw new Error('Invalid booking data')
    }
    const validation = await bookingService.validateBookingRequest(validationResult.data as any)

    return res.json(ResponseBuilder.success(validation, 'Booking validation completed'))
  })

  return {
    createBooking,
    getBookingById,
    getUserBookings,
    updateBookingStatus,
    cancelBooking,
    getAllBookings,
    getBookingsByShow,
    getBookingsByDateRange,
    getBookingsByStatus,
    getUpcomingBookings,
    getPastBookings,
    getCancellableBookings,
    getBookingStatistics,
    getRevenueByPeriod,
    getPopularMovies,
    getBookingByReference,
    generateTicket,
    checkBookingAccess,
    canCancelBooking,
    validateBooking
  }
}