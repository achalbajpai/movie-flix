'use client'

import { useState, useCallback } from 'react'
import { api, BookingResponse } from '@/lib/api'

interface CreateBookingData {
  userId: string
  busId: string
  scheduleId: number
  seatIds: number[]
  passengers: Array<{
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
  const createBooking = useCallback(async (bookingData: CreateBookingData): Promise<BookingResponse | null> => {
    updateState({ loading: true, error: null })

    try {
      const response = await api.createBooking({
        userId: bookingData.userId,
        busId: bookingData.busId,
        scheduleId: bookingData.scheduleId,
        seatIds: bookingData.seatIds,
        passengers: bookingData.passengers,
        contactDetails: bookingData.contactDetails
      })

      if (response.success && response.data) {
        updateState({ loading: false })
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
      const response = await api.cancelBooking(bookingId, userId)

      if (response.success) {
        updateState({ loading: false })
        return true
      } else {
        throw new Error(response.error?.message || 'Failed to cancel booking')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking'
      updateState({
        loading: false,
        error: errorMessage
      })
      return false
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