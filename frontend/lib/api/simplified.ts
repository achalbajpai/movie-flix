import { apiClient, ApiResponse } from './client'
import { BookingResponse, CreateBookingRequest } from './booking'
import { BusSearchParams } from './bus'
import { DEV_CONFIG, ERROR_MESSAGES } from '@/lib/constants'

// Simplified API export for easier use in components
export const api = {
  searchBuses: (params: BusSearchParams) => apiClient.searchBuses(params),
  getBusById: (id: string) => apiClient.getBusById(id),

  // Simplified booking methods with data transformation
  createBooking: async (data: {
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
      userId: DEV_CONFIG.MOCK_USER_ID, // TODO: Get from auth context when implemented
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

  getBooking: (bookingId: string) => apiClient.getBookingById(parseInt(bookingId)),
  getUserBookings: (userId: string) => apiClient.getUserBookings(userId),
  cancelBooking: (bookingId: string) => apiClient.cancelBooking(parseInt(bookingId), DEV_CONFIG.MOCK_USER_ID)
}