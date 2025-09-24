export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: ApiError
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
    limit: number
  }
}

export class ResponseBuilder {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }
  }

  static error(error: ApiError, message?: string): ApiResponse<never> {
    return {
      success: false,
      error,
      message: message || error.message,
      timestamp: new Date().toISOString()
    }
  }

  static paginated<T>(
    data: T[],
    currentPage: number,
    limit: number,
    totalItems: number,
    message?: string
  ): ApiResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(totalItems / limit)
    const hasNext = currentPage < totalPages
    const hasPrevious = currentPage > 1

    return {
      success: true,
      data: {
        data,
        pagination: {
          currentPage,
          totalPages,
          totalItems,
          hasNext,
          hasPrevious,
          limit
        }
      },
      message,
      timestamp: new Date().toISOString()
    }
  }
}

export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT'
}

export class ApiErrorBuilder {
  static validationError(details: Record<string, any>, message = 'Validation failed'): ApiError {
    return {
      code: ApiErrorCode.VALIDATION_ERROR,
      message,
      details
    }
  }

  static notFound(resource = 'Resource', message?: string): ApiError {
    return {
      code: ApiErrorCode.NOT_FOUND,
      message: message || `${resource} not found`
    }
  }

  static internalError(message = 'Internal server error', details?: Record<string, any>): ApiError {
    return {
      code: ApiErrorCode.INTERNAL_ERROR,
      message,
      details
    }
  }

  static badRequest(message = 'Bad request', details?: Record<string, any>): ApiError {
    return {
      code: ApiErrorCode.BAD_REQUEST,
      message,
      details
    }
  }

  static rateLimitExceeded(message = 'Rate limit exceeded'): ApiError {
    return {
      code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
      message
    }
  }
}