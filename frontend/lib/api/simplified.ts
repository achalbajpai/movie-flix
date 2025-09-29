import { apiClient, ApiResponse } from './client'
import { BookingResponse, CreateBookingRequest } from './booking'
import { BusSearchParams } from './bus'
import { ERROR_MESSAGES } from '@/lib/constants'

// Simplified API export for easier use in components
export const api = {
  searchBuses: (params: BusSearchParams) => apiClient.searchBuses(params),
  getBusById: (id: string) => apiClient.getBusById(id),

  // Simplified booking methods with data transformation
  createBooking: async (data: {
    userId: string
    busId: string
    scheduleId: number
    seatIds: number[]
    passengers: Array<{ name: string; age: number; gender: 'male' | 'female' | 'other' }>
    contactDetails: { email: string; phone: string }
  }): Promise<ApiResponse<BookingResponse>> => {
    // Validate required fields
    if (!data.scheduleId) {
      throw new Error(ERROR_MESSAGES.MISSING_SCHEDULE_ID)
    }

    const bookingData: CreateBookingRequest = {
      userId: data.userId,
      scheduleId: data.scheduleId,
      seatIds: data.seatIds,
      passengers: data.passengers,
      contactDetails: data.contactDetails
    }

    const response = await apiClient.createBooking(bookingData)

    // Transform the complex response to simple format
    if (response.success && response.data) {
      const simpleResponse: BookingResponse = {
        id: response.data.bookingReference,
        status: 'confirmed',
        totalAmount: response.data.totalAmount,
        journeyDate: response.data.schedule.departure,
        createdAt: new Date().toISOString(),
        bus: {
          id: data.busId,
          operatorName: 'Bus Operator', // TODO: Get from bus details
          route: response.data.schedule.route,
          departureTime: response.data.schedule.departure,
          arrivalTime: response.data.schedule.arrival,
          duration: 0, // TODO: Calculate
          price: response.data.totalAmount / data.seatIds.length
        },
        passengers: data.passengers,
        seats: response.data.seats.map((seat: any, index: number) => ({
          seatId: data.seatIds[index] ?? 0,
          seatNo: seat.seatNo,
          price: response.data!.totalAmount / data.seatIds.length
        })),
        contactDetails: data.contactDetails
      }

      return {
        success: response.success,
        data: simpleResponse,
        message: response.message,
        timestamp: response.timestamp
      }
    }

    return {
      success: false,
      error: response.error,
      timestamp: response.timestamp
    }
  },

  getBooking: async (bookingId: string): Promise<BookingResponse | null> => {
    const response = await apiClient.getBookingById(parseInt(bookingId))

    if (response.success && response.data) {
      // Transform backend booking data to frontend format
      const booking = response.data
      const transformedBooking: BookingResponse = {
        id: booking.booking_id?.toString() || '',
        status: booking.status || 'pending',
        totalAmount: booking.total_amt || 0,
        journeyDate: booking.schedule?.departure || '',
        createdAt: booking.created_at || '',
        bus: {
          id: booking.schedule?.bus?.bus_id?.toString() || '',
          operatorName: booking.schedule?.operator?.company || 'Unknown Operator',
          route: `${booking.schedule?.route?.source_des || 'Source'} to ${booking.schedule?.route?.drop_des || 'Destination'}`,
          departureTime: booking.schedule?.departure || '',
          arrivalTime: booking.schedule?.arrival || '',
          duration: 0,
          price: booking.schedule?.base_price || 0
        },
        passengers: (booking.passengers || []).map((p: any) => ({
          name: p.pass_name || '',
          age: p.pass_age || 0,
          gender: p.gender || 'male'
        })),
        seats: (booking.passengers || []).map((p: any) => ({
          seatId: p.seat_id || 0,
          seatNo: p.seat_no || '',
          price: p.price || 0
        })),
        contactDetails: booking.contactDetails || { email: '', phone: '' }
      }

      return transformedBooking
    }

    return null
  },

  getUserBookings: async (userId: string): Promise<ApiResponse<{ data: BookingResponse[] }>> => {
    const response = await apiClient.getUserBookings(userId)

    if (response.success && response.data) {
      // Transform backend booking data to frontend format
      const transformedBookings: BookingResponse[] = (response.data.data || []).map((booking: any) => ({
        id: booking.booking_id?.toString() || '',
        status: booking.status || 'pending',
        totalAmount: booking.total_amt || 0,
        journeyDate: booking.schedule?.departure || '',
        createdAt: booking.created_at || '',
        bus: {
          id: booking.schedule?.bus?.bus_id?.toString() || '',
          operatorName: booking.schedule?.operator?.company || 'Unknown Operator',
          route: `${booking.schedule?.route?.source_des || 'Source'} to ${booking.schedule?.route?.drop_des || 'Destination'}`,
          departureTime: booking.schedule?.departure || '',
          arrivalTime: booking.schedule?.arrival || '',
          duration: 0,
          price: booking.schedule?.base_price || 0
        },
        passengers: (booking.passengers || []).map((p: any) => ({
          name: p.pass_name || '',
          age: p.pass_age || 0,
          gender: p.gender || 'male'
        })),
        seats: (booking.passengers || []).map((p: any) => ({
          seatId: p.seat_id || 0,
          seatNo: p.seat_no || '',
          price: p.price || 0
        })),
        contactDetails: booking.contactDetails || { email: '', phone: '' }
      }))

      return {
        success: true,
        data: { data: transformedBookings },
        message: response.message,
        timestamp: response.timestamp
      }
    }

    return response
  },

  cancelBooking: (bookingId: string, userId: string) => apiClient.cancelBooking(parseInt(bookingId), userId),
  downloadTicket: (bookingId: string) => apiClient.generateTicket(parseInt(bookingId))
}