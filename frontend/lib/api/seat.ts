import { apiClient, ApiResponse } from './client'

export interface SeatDetails {
  seat_id: number
  schedule_id: number
  seat_no: string
  is_reserved: boolean
  price: number
  reservation_expires_at?: string
}

export interface SeatLayout {
  totalSeats: number
  layout: SeatLayoutRow[]
  busType: string
}

export interface SeatLayoutRow {
  rowNumber: number
  leftSeats: SeatDetails[]
  rightSeats: SeatDetails[]
  isExit?: boolean
}

export interface SeatAvailabilityResponse {
  available: boolean
  unavailableSeats: number[]
  conflictReason: string[]
}

export interface SeatPricingResponse {
  totalPrice: number
  seatPrices: Array<{
    seatId: number
    price: number
    seatNo: string
  }>
}

export interface SeatSelectionValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface SeatReservationRequest {
  scheduleId: number
  seatIds: number[]
  userId: string
  expiresAt?: string
}

export interface SeatReservation {
  reservation_id: string
  schedule_id: number
  seat_ids: number[]
  user_id: string
  expires_at: string
  created_at: string
}

export const seatApi = {
  getLayout: (scheduleId: number) => apiClient.getSeatLayout(scheduleId),
  getAvailable: (scheduleId: number) => apiClient.getAvailableSeatsForSchedule(scheduleId),
  checkAvailability: (scheduleId: number, seatIds: number[]) => apiClient.checkSeatAvailability(scheduleId, seatIds),
  calculatePrices: (scheduleId: number, seatIds: number[]) => apiClient.calculateSeatPrices(scheduleId, seatIds),
  validateSelection: (scheduleId: number, seatIds: number[]) => apiClient.validateSeatSelection(scheduleId, seatIds),
  createReservation: (reservationData: SeatReservationRequest) => apiClient.createSeatReservation(reservationData),
  getReservation: (reservationId: string) => apiClient.getSeatReservation(reservationId),
  extendReservation: (reservationId: string, additionalMinutes: number) => apiClient.extendReservation(reservationId, additionalMinutes),
  cancelReservation: (reservationId: string) => apiClient.cancelReservation(reservationId),
  getTimeRemaining: (reservationId: string) => apiClient.getReservationTimeRemaining(reservationId)
}