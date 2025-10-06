// Application constants

// Seat selection configuration
export const SEAT_CONFIG = {
  AVAILABILITY_REFRESH_INTERVAL: process.env.NEXT_PUBLIC_SEAT_REFRESH_INTERVAL
    ? parseInt(process.env.NEXT_PUBLIC_SEAT_REFRESH_INTERVAL)
    : 30000,

  MAX_SEATS_PER_BOOKING: process.env.NEXT_PUBLIC_MAX_SEATS_PER_BOOKING
    ? parseInt(process.env.NEXT_PUBLIC_MAX_SEATS_PER_BOOKING)
    : 6,
} as const

export const BOOKING_CONFIG = {
  DEFAULT_CUSTOMER_AGE: 25,
  REFERENCE_PREFIX: 'MV',
} as const

export const API_CONFIG = {
  DEFAULT_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT
    ? parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT)
    : 30000,
  RETRY_ATTEMPTS: 3,
} as const

export const VALIDATION_CONFIG = {
  MIN_CUSTOMER_AGE: 1,
  MAX_CUSTOMER_AGE: 120,
  PHONE_PATTERN: /^[6-9]\d{9}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

export const UI_CONFIG = {
  SEARCH_DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  SKELETON_ANIMATION_DURATION: 1000,
} as const

export const DEV_CONFIG = {
  MOCK_USER_ID: '8b5c9a8f-9a3a-4a2b-8c7d-3e5f1a3b2c1d',
  ENABLE_DEV_LOGS: process.env.NODE_ENV === 'development',
} as const

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  INVALID_SHOW: 'Invalid show selected. Please select a valid show.',
  SEAT_UNAVAILABLE: 'Selected seats are no longer available. Please select different seats.',
  BOOKING_FAILED: 'Booking failed. Please try again.',
  VALIDATION_FAILED: 'Please check the form data and try again.',
  MISSING_SHOW_ID: 'Show ID is required to proceed with booking.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Your booking has been created successfully!',
  SEATS_SELECTED: 'Seats selected successfully.',
  FORM_SUBMITTED: 'Form submitted successfully.',
} as const