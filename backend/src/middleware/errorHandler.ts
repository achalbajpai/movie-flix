import { Request, Response, NextFunction } from 'express'
import { logger } from '@/config'
import { ApiError, ApiErrorBuilder, ResponseBuilder, ApiErrorCode } from '@/utils'
import { ZodError } from 'zod'
import { ValidationError } from '@/utils/ValidationHelpers'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Convert different error types to ApiError
const convertToApiError = (error: any): { apiError: ApiError; statusCode: number } => {
  // Custom ValidationError from ValidationHelpers
  if (error instanceof ValidationError) {
    return {
      apiError: ApiErrorBuilder.validationError(error.details, error.message),
      statusCode: 400
    }
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.reduce((acc, issue) => {
      const path = issue.path.join('.')
      acc[path] = {
        message: issue.message,
        code: issue.code,
        received: 'received' in issue ? issue.received : undefined
      }
      return acc
    }, {} as Record<string, any>)

    return {
      apiError: ApiErrorBuilder.validationError(details, 'Validation failed'),
      statusCode: 400
    }
  }

  // Custom application errors
  if (error instanceof CustomError) {
    const apiError: ApiError = {
      code: error.statusCode === 404 ? ApiErrorCode.NOT_FOUND : ApiErrorCode.INTERNAL_ERROR,
      message: error.message,
      details: error.isOperational ? undefined : { stack: error.stack }
    }
    return { apiError, statusCode: error.statusCode }
  }

  // Express rate limit errors
  if (error.type === 'RateLimiterError' || error.message?.includes('rate limit')) {
    return {
      apiError: ApiErrorBuilder.rateLimitExceeded(),
      statusCode: 429
    }
  }

  // MongoDB/Database errors (when we add database)
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    const apiError: ApiError = {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Database operation failed'
    }
    return { apiError, statusCode: 500 }
  }

  // Default error
  const apiError = ApiErrorBuilder.internalError(
    error.message || 'An unexpected error occurred',
    { originalError: error.name }
  )
  return { apiError, statusCode: 500 }
}

// Global error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  const { apiError, statusCode } = convertToApiError(error)

  // Send error response
  res.status(statusCode).json(ResponseBuilder.error(apiError))
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(
    `Resource not found - ${req.originalUrl}`,
    404
  )
  next(error)
}

// Unhandled promise rejection handler
export const handleUnhandledRejections = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise
    })
  })
}

// Uncaught exception handler
export const handleUncaughtExceptions = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack
    })

    // Graceful shutdown
    process.exit(1)
  })
}

// Graceful shutdown handler
export const handleGracefulShutdown = (): void => {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`)

    // Close server, database connections, etc.
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}