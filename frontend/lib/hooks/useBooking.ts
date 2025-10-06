'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api/simplified'
import { BookingResponse } from '@/lib/api'

interface CreateBookingData {
  userId: string
  showId: number
  seatIds: number[]
  customers: Array<{
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
  }>
  contactDetails: {
    email: string
    phone: string
  }
}

interface UseBookingState {
  loading: boolean
  error: string | null
}

export function useBooking() {
  const [state, setState] = useState<UseBookingState>({
    loading: false,
    error: null
  })

  const updateState = (updates: Partial<UseBookingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Create a new booking
  const createBooking = useCallback(async (bookingData: CreateBookingData): Promise<any> => {
    updateState({ loading: true, error: null })

    try {
      const response = await api.createBooking({
        userId: bookingData.userId,
        showId: bookingData.showId,
        seatIds: bookingData.seatIds,
        customers: bookingData.customers,
        contactDetails: bookingData.contactDetails
      })

      if (response.success && response.data) {
        updateState({ loading: false })
        // Backend returns BookingConfirmation with bookingId
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to create booking')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking'
      updateState({
        loading: false,
        error: errorMessage
      })
      throw error
    }
  }, [])

  // Get booking by ID
  const getBooking = useCallback(async (bookingId: string): Promise<BookingResponse | null> => {
    updateState({ loading: true, error: null })

    try {
      const booking = await api.getBooking(bookingId)

      updateState({ loading: false })
      return booking
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking'
      updateState({
        loading: false,
        error: errorMessage
      })
      return null
    }
  }, [])

  // Get user bookings
  const getUserBookings = useCallback(async (userId: string): Promise<BookingResponse[]> => {
    updateState({ loading: true, error: null })

    try {
      const response = await api.getUserBookings(userId)

      if (response.success && response.data) {
        updateState({ loading: false })
        return response.data.data || []
      } else {
        throw new Error(response.error?.message || 'Failed to fetch bookings')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings'
      updateState({
        loading: false,
        error: errorMessage
      })
      return []
    }
  }, [])

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId: string, userId: string): Promise<boolean> => {
    updateState({ loading: true, error: null })

    try {
      console.log('[useBooking] Cancelling booking:', bookingId)
      const response = await api.cancelBooking(bookingId, userId)
      console.log('[useBooking] Cancel response:', response)

      if (response.success) {
        updateState({ loading: false })
        console.log('[useBooking] Booking cancelled successfully')
        return true
      } else {
        const errorMsg = response.error?.message || 'Failed to cancel booking'
        console.error('[useBooking] Cancel failed:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking'
      console.error('[useBooking] Cancel error:', errorMessage)
      updateState({
        loading: false,
        error: errorMessage
      })
      throw error
    }
  }, [])

  return {
    // State
    loading: state.loading,
    error: state.error,

    // Actions
    createBooking,
    getBooking,
    getUserBookings,
    cancelBooking
  }
}