import { apiClient, ApiResponse } from './client'
import { BookingResponse, CreateBookingRequest } from './booking'

// Simplified API export for easier use in components
export const api = {
  // Simplified booking methods with data transformation
  createBooking: async (data: {
    userId: string
    showId: number
    seatIds: number[]
    customers: Array<{ name: string; age: number; gender: 'male' | 'female' | 'other' }>
    contactDetails: { email: string; phone: string }
  }): Promise<ApiResponse<any>> => {
    const bookingData: CreateBookingRequest = {
      userId: data.userId,
      showId: data.showId,
      seatIds: data.seatIds,
      customers: data.customers,
      contactDetails: data.contactDetails
    }

    const response = await apiClient.createBooking(bookingData)
    // Backend returns BookingConfirmation with bookingId, keep it as-is
    return response
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
        showDate: booking.show?.show_time || '',
        createdAt: booking.created_at || '',
        show: {
          showId: booking.show?.show_id || 0,
          movieTitle: booking.show?.movie?.title || 'Unknown Movie',
          theaterName: booking.show?.theater?.name || 'Unknown Theater',
          screenName: booking.show?.screen?.screen_name || '',
          showTime: booking.show?.show_time || '',
          showType: booking.show?.show_type || 'standard',
          basePrice: booking.show?.base_price || 0
        },
        customers: (booking.customers || []).map((c: any) => ({
          name: c.customer_name || '',
          age: c.customer_age || 0,
          gender: c.gender || 'male'
        })),
        seats: (booking.customers || []).map((c: any) => ({
          seatId: c.seat_id || 0,
          seatNo: c.seat_no || '',
          price: c.price || 0
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
        showDate: booking.show?.show_time || '',
        createdAt: booking.created_at || '',
        show: {
          showId: booking.show?.show_id || 0,
          movieTitle: booking.show?.movie?.title || 'Unknown Movie',
          theaterName: booking.show?.theater?.name || 'Unknown Theater',
          screenName: booking.show?.screen?.screen_name || '',
          showTime: booking.show?.show_time || '',
          showType: booking.show?.show_type || 'standard',
          basePrice: booking.show?.base_price || 0
        },
        customers: (booking.customers || []).map((c: any) => ({
          name: c.customer_name || '',
          age: c.customer_age || 0,
          gender: c.gender || 'male'
        })),
        seats: (booking.customers || []).map((c: any) => ({
          seatId: c.seat_id || 0,
          seatNo: c.seat_no || '',
          price: c.price || 0
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

  cancelBooking: async (bookingId: string, userId: string) => {
    console.log('[API] Cancelling booking:', bookingId, 'for user:', userId)
    const response = await apiClient.cancelBooking(parseInt(bookingId), userId)
    console.log('[API] Cancel booking response:', response)
    return response
  },
  downloadTicket: (bookingId: string) => apiClient.generateTicket(parseInt(bookingId))
}