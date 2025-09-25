import { ValidationErrorDetail } from './types'
import { ApiErrorBuilder } from '@/utils'
import { logger } from '@/config'

export class ValidationFactoryError extends Error {
  constructor(
    public readonly type: 'VALIDATION_FAILED' | 'SCHEMA_NOT_FOUND' | 'TRANSFORM_ERROR' | 'CONFIGURATION_ERROR',
    public readonly details: ValidationErrorDetail[],
    message?: string
  ) {
    super(message || `Validation error: ${type}`)
    this.name = 'ValidationFactoryError'
  }

  toApiError() {
    return ApiErrorBuilder.validationError(
      this.details.reduce((acc, detail) => ({
        ...acc,
        [detail.field]: {
          message: detail.message,
          code: detail.code,
          received: detail.received
        }
      }), {}),
      this.message
    )
  }

  getSummary(): string {
    return `${this.type}: ${this.details.length} validation error(s)`
  }

  getErrorFields(): string[] {
    return this.details.map(detail => detail.field)
  }
}

export const createValidationErrorHandler = () => {
  return {
    handleValidationError: (error: ValidationFactoryError, context?: Record<string, any>) => {
      logger.warn('Validation error occurred', {
        type: error.type,
        errorCount: error.details.length,
        fields: error.getErrorFields(),
        context
      })

      return error.toApiError()
    },

    handleSchemaNotFound: (schemaName: string, availableSchemas: string[]) => {
      const error = new ValidationFactoryError(
        'SCHEMA_NOT_FOUND',
        [{
          field: 'schema',
          message: `Schema '${schemaName}' not found`,
          code: 'SCHEMA_NOT_FOUND'
        }],
        `Schema '${schemaName}' not found. Available schemas: ${availableSchemas.join(', ')}`
      )

      logger.error('Schema not found', {
        requestedSchema: schemaName,
        availableSchemas
      })

      return error.toApiError()
    },

    handleTransformError: (originalError: Error, field: string = 'transform') => {
      const error = new ValidationFactoryError(
        'TRANSFORM_ERROR',
        [{
          field,
          message: originalError.message,
          code: 'TRANSFORM_ERROR'
        }],
        `Data transformation failed: ${originalError.message}`
      )

      logger.error('Transform error', {
        originalError: originalError.message,
        field
      })

      return error.toApiError()
    },

    handleConfigurationError: (message: string, details?: Record<string, any>) => {
      const error = new ValidationFactoryError(
        'CONFIGURATION_ERROR',
        [{
          field: 'configuration',
          message,
          code: 'CONFIGURATION_ERROR'
        }],
        `Configuration error: ${message}`
      )

      logger.error('Configuration error', {
        message,
        details
      })

      return error.toApiError()
    },

    createFromZodError: (zodError: any): ValidationFactoryError => {
      const details: ValidationErrorDetail[] = zodError.issues.map((issue: any) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
        code: issue.code,
        received: 'received' in issue ? issue.received : undefined
      }))

      return new ValidationFactoryError(
        'VALIDATION_FAILED',
        details,
        `Validation failed with ${details.length} error(s)`
      )
    }
  }
}

export const validationErrorHandler = createValidationErrorHandler()

export const ValidationErrors = {
  required: (field: string): ValidationErrorDetail => ({
    field,
    message: `${field} is required`,
    code: 'REQUIRED'
  }),

  invalidType: (field: string, expected: string, received: any): ValidationErrorDetail => ({
    field,
    message: `Expected ${expected}, received ${typeof received}`,
    code: 'INVALID_TYPE',
    received
  }),

  outOfRange: (field: string, min?: number, max?: number, received?: any): ValidationErrorDetail => ({
    field,
    message: `Value must be between ${min} and ${max}`,
    code: 'OUT_OF_RANGE',
    received
  }),

  invalidFormat: (field: string, format: string, received?: any): ValidationErrorDetail => ({
    field,
    message: `Invalid ${format} format`,
    code: 'INVALID_FORMAT',
    received
  }),

  // Custom error
  custom: (field: string, message: string, code: string = 'VALIDATION_ERROR', received?: any): ValidationErrorDetail => ({
    field,
    message,
    code,
    received
  })
}

// Error aggregation utility
export class ValidationErrorAggregator {
  private errors: ValidationErrorDetail[] = []

  add(error: ValidationErrorDetail): void {
    this.errors.push(error)
  }

  addMultiple(errors: ValidationErrorDetail[]): void {
    this.errors.push(...errors)
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  getErrors(): ValidationErrorDetail[] {
    return [...this.errors]
  }

  clear(): void {
    this.errors = []
  }

  getErrorCount(): number {
    return this.errors.length
  }

  getFieldsWithErrors(): string[] {
    return [...new Set(this.errors.map(error => error.field))]
  }

  toError(type: ValidationFactoryError['type'] = 'VALIDATION_FAILED'): ValidationFactoryError {
    return new ValidationFactoryError(
      type,
      this.getErrors(),
      `Validation failed with ${this.getErrorCount()} error(s)`
    )
  }
}