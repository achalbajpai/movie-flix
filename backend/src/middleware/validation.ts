import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validateSchema, ValidationError } from '@/utils'

// Validation middleware factory
export const validate = <T>(schema: z.ZodSchema<T>, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[target]
      const validatedData = validateSchema(schema, dataToValidate)

      // Attach validated data to request
      req[target] = validatedData

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Multiple validation targets
export const validateMultiple = (validations: Array<{
  schema: z.ZodSchema<any>
  target: 'body' | 'query' | 'params'
}>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const { schema, target } of validations) {
        const dataToValidate = req[target]
        const validatedData = validateSchema(schema, dataToValidate)
        req[target] = validatedData
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim()
      }
    })
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.trim()
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {}
        Object.keys(obj).forEach(key => {
          sanitized[key] = sanitizeObject(obj[key])
        })
        return sanitized
      }
      return obj
    }

    req.body = sanitizeObject(req.body)
  }

  next()
}