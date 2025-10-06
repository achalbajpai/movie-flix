'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { SEAT_CONFIG } from '@/lib/constants'
import {
  seatApi,
  SeatLayout,
  SeatDetails,
  SeatAvailabilityResponse,
  SeatPricingResponse,
  SeatSelectionValidation,
  SeatReservation,
  SeatReservationRequest
} from '@/lib/api'

interface UseSeatSelectionState {
  layout: SeatLayout | null
  availableSeats: SeatDetails[]
  selectedSeats: number[]
  reservedSeats: Map<number, SeatReservation>
  pricing: SeatPricingResponse | null
  loading: boolean
  error: string | null
  reservationTimer: number // seconds remaining
  lastAvailabilityCheck: Date | null
}

export function useSeatSelection(showId: number, userId: string) {
  const [state, setState] = useState<UseSeatSelectionState>({
    layout: null,
    availableSeats: [],
    selectedSeats: [],
    reservedSeats: new Map(),
    pricing: null,
    loading: false,
    error: null,
    reservationTimer: 0,
    lastAvailabilityCheck: null
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const availabilityCheckRef = useRef<NodeJS.Timeout | null>(null)

  const updateState = (updates: Partial<UseSeatSelectionState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Load initial seat layout and available seats
  const loadSeatLayout = useCallback(async () => {
    updateState({ loading: true, error: null })

    try {
      const [layoutResponse, availableResponse] = await Promise.all([
        seatApi.getLayout(showId),
        seatApi.getAvailable(showId)
      ])

      if (layoutResponse.success && availableResponse.success) {
        updateState({
          layout: layoutResponse.data,
          availableSeats: availableResponse.data || [],
          loading: false,
          lastAvailabilityCheck: new Date()
        })
      } else {
        throw new Error('Failed to load seat information')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load seats'
      updateState({
        loading: false,
        error: errorMessage
      })
    }
  }, [showId])

  // Check availability of specific seats
  const checkSeatAvailability = useCallback(async (seatIds: number[]): Promise<SeatAvailabilityResponse | null> => {
    if (seatIds.length === 0) return null

    try {
      const response = await seatApi.checkAvailability(showId, seatIds)

      if (response.success && response.data) {
        updateState({ lastAvailabilityCheck: new Date() })
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to check seat availability')
      }
    } catch (error) {
      return null
    }
  }, [showId])

  // Select or deselect a seat
  const toggleSeat = useCallback(async (seatId: number) => {
    const isCurrentlySelected = state.selectedSeats.includes(seatId)

    if (isCurrentlySelected) {
      // Deselect seat
      const newSelection = state.selectedSeats.filter(id => id !== seatId)
      updateState({ selectedSeats: newSelection })

      // Cancel reservation if exists
      const reservation = state.reservedSeats.get(seatId)
      if (reservation) {
        try {
          await seatApi.cancelReservation(reservation.reservation_id)
          const newReservations = new Map(state.reservedSeats)
          newReservations.delete(seatId)
          updateState({ reservedSeats: newReservations })
        } catch (error) {
          // Silently handle cancellation errors
        }
      }

      // Update pricing
      if (newSelection.length > 0) {
        updatePricing(newSelection)
      } else {
        updateState({ pricing: null })
      }
    } else {
      // Check if seat is available
      const availability = await checkSeatAvailability([seatId])
      if (!availability?.available) {
        updateState({ error: 'This seat is no longer available' })
        return false
      }

      // Select seat
      const newSelection = [...state.selectedSeats, seatId]
      updateState({ selectedSeats: newSelection })

      // Create reservation
      try {
        const reservationData: SeatReservationRequest = {
          showId,
          seatIds: [seatId],
          userId,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        }

        const response = await seatApi.createReservation(reservationData)
        if (response.success && response.data) {
          const newReservations = new Map(state.reservedSeats)
          newReservations.set(seatId, response.data)
          updateState({
            reservedSeats: newReservations,
            reservationTimer: 300 // 5 minutes in seconds
          })

          // Start countdown timer
          startReservationTimer()
        }
      } catch (error) {
        // Remove seat from selection if reservation failed
        const newSelection = state.selectedSeats.filter(id => id !== seatId)
        updateState({
          selectedSeats: newSelection,
          error: 'Failed to reserve seat. Please try again.'
        })
        return false
      }

      // Update pricing
      updatePricing(newSelection)
    }

    return true
  }, [state.selectedSeats, state.reservedSeats, showId, userId])

  // Update pricing for selected seats
  const updatePricing = useCallback(async (seatIds: number[]) => {
    if (seatIds.length === 0) {
      updateState({ pricing: null })
      return
    }

    try {
      const response = await seatApi.calculatePrices(showId, seatIds)

      if (response.success && response.data) {
        updateState({ pricing: response.data })
      }
    } catch (error) {
      // Silently handle pricing calculation errors
    }
  }, [showId])

  // Validate current seat selection
  const validateSelection = useCallback(async (): Promise<SeatSelectionValidation | null> => {
    if (state.selectedSeats.length === 0) return null

    try {
      const response = await seatApi.validateSelection(showId, state.selectedSeats)

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to validate selection')
      }
    } catch (error) {
      return null
    }
  }, [showId, state.selectedSeats])

  // Extend reservation
  const extendReservation = useCallback(async (seatId: number, additionalMinutes: number = 5): Promise<boolean> => {
    const reservation = state.reservedSeats.get(seatId)
    if (!reservation) return false

    try {
      const response = await seatApi.extendReservation(reservation.reservation_id, additionalMinutes)

      if (response.success && response.data) {
        const newReservations = new Map(state.reservedSeats)
        newReservations.set(seatId, response.data)
        updateState({
          reservedSeats: newReservations,
          reservationTimer: state.reservationTimer + (additionalMinutes * 60)
        })
        return true
      }
    } catch (error) {
      // Silently handle extension errors
    }

    return false
  }, [state.reservedSeats, state.reservationTimer])

  // Clear all selections and reservations
  const clearSelection = useCallback(async () => {
    // Cancel all reservations
    for (const reservation of state.reservedSeats.values()) {
      try {
        await seatApi.cancelReservation(reservation.reservation_id)
      } catch (error) {
        // Silently handle cancellation errors
      }
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    updateState({
      selectedSeats: [],
      reservedSeats: new Map(),
      pricing: null,
      reservationTimer: 0,
      error: null
    })
  }, [state.reservedSeats])

  // Start reservation countdown timer
  const startReservationTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.reservationTimer <= 1) {
          // Timer expired
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return {
            ...prev,
            reservationTimer: 0,
            selectedSeats: [],
            reservedSeats: new Map(),
            pricing: null,
            error: 'Your seat reservation has expired. Please select seats again.'
          }
        }
        return {
          ...prev,
          reservationTimer: prev.reservationTimer - 1
        }
      })
    }, 1000)
  }, [])

  // Refresh available seats periodically
  const refreshAvailability = useCallback(async () => {
    try {
      const response = await seatApi.getAvailable(showId)
      if (response.success && response.data) {
        updateState({
          availableSeats: response.data,
          lastAvailabilityCheck: new Date()
        })
      }
    } catch (error) {
      // Silently handle availability refresh errors
    }
  }, [showId])

  // Utility functions
  const isSeatAvailable = useCallback((seatId: number) => {
    return state.availableSeats.some(seat => seat.seat_id === seatId)
  }, [state.availableSeats])

  const isSeatSelected = useCallback((seatId: number) => {
    return state.selectedSeats.includes(seatId)
  }, [state.selectedSeats])

  const isSeatReserved = useCallback((seatId: number) => {
    return state.reservedSeats.has(seatId)
  }, [state.reservedSeats])

  const getSeatPrice = useCallback((seatId: number) => {
    const pricing = state.pricing?.seatPrices.find(p => p.seatId === seatId)
    return pricing?.price || 0
  }, [state.pricing])

  const getTotalPrice = useCallback(() => {
    return state.pricing?.totalPrice || 0
  }, [state.pricing])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Load seat layout on mount
  useEffect(() => {
    if (showId) {
      loadSeatLayout()
    }
  }, [showId, loadSeatLayout])

  // Set up periodic availability refresh
  useEffect(() => {
    availabilityCheckRef.current = setInterval(() => {
      refreshAvailability()
    }, SEAT_CONFIG.AVAILABILITY_REFRESH_INTERVAL)

    return () => {
      if (availabilityCheckRef.current) {
        clearInterval(availabilityCheckRef.current)
      }
    }
  }, [refreshAvailability])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (availabilityCheckRef.current) {
        clearInterval(availabilityCheckRef.current)
      }

      // Cancel any active reservations
      state.reservedSeats.forEach(async (reservation) => {
        try {
          await seatApi.cancelReservation(reservation.reservation_id)
        } catch (error) {
          // Silently handle cleanup errors
        }
      })
    }
  }, [state.reservedSeats])

  return {
    // State
    layout: state.layout,
    availableSeats: state.availableSeats,
    selectedSeats: state.selectedSeats,
    reservedSeats: state.reservedSeats,
    pricing: state.pricing,
    loading: state.loading,
    error: state.error,
    reservationTimer: state.reservationTimer,
    lastAvailabilityCheck: state.lastAvailabilityCheck,

    // Actions
    loadSeatLayout,
    toggleSeat,
    validateSelection,
    extendReservation,
    clearSelection,
    refreshAvailability,

    // Utilities
    isSeatAvailable,
    isSeatSelected,
    isSeatReserved,
    getSeatPrice,
    getTotalPrice,
    formatTime
  }
}