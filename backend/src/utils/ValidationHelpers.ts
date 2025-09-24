import { z } from 'zod'
import { ApiErrorBuilder } from './ApiResponse'

export class ValidationError extends Error {
  constructor(
    public readonly details: Record<string, any>,
    message = 'Validation failed'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.issues.reduce((acc, issue) => {
      const path = issue.path.join('.')
      acc[path] = {
        message: issue.message,
        code: issue.code,
        received: 'received' in issue ? issue.received : undefined
      }
      return acc
    }, {} as Record<string, any>)

    throw new ValidationError(errors)
  }

  return result.data
}

export const validateAndTransform = <T, U>(
  schema: z.ZodSchema<T>,
  data: unknown,
  transformer?: (validated: T) => U
): U | T => {
  const validated = validateSchema(schema, data)
  return transformer ? transformer(validated) : validated
}

// Common validation patterns
export const commonValidations = {
  objectId: z.string().min(1, 'ID is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format'),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeString: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().min(0, 'Must be a non-negative number'),
  rating: z.number().min(0, 'Rating cannot be negative').max(5, 'Rating cannot exceed 5'),
  url: z.string().url('Invalid URL format')
}

// Sanitization helpers
export const sanitize = {
  trim: (str: string): string => str.trim(),
  toLowerCase: (str: string): string => str.toLowerCase(),
  upperCase: (str: string): string => str.toUpperCase(),
  removeExtraSpaces: (str: string): string => str.replace(/\s+/g, ' ').trim(),
  alphanumericOnly: (str: string): string => str.replace(/[^a-zA-Z0-9]/g, ''),
  numbersOnly: (str: string): string => str.replace(/[^0-9]/g, '')
}

// Validation middleware helper
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => {
    try {
      return validateSchema(schema, data)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw ApiErrorBuilder.validationError(error.details, error.message)
      }
      throw error
    }
  }
}