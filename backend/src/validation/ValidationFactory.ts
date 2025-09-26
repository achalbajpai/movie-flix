import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'
import {
  IValidationFactory,
  ValidationTarget,
  ValidationMode,
  ValidationStrategy,
  ValidationConfig,
  ValidationResult,
  ValidationErrorDetail,
  SchemaDefinition,
  SchemaRegistry
} from './types'
import { ValidationError } from '@/utils/ValidationHelpers'
import { ApiErrorBuilder } from '@/utils'
import { logger } from '@/config'

export class ValidationFactory implements IValidationFactory {
  private schemas: SchemaRegistry = new Map()
  private defaultConfig: ValidationConfig = {
    mode: 'strict',
    strategy: 'throw',
    transform: true,
    stripUnknown: true,
    abortEarly: false
  }

  constructor(config?: Partial<ValidationConfig>) {
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config }
    }
  }

  // Schema management methods
  registerSchema<T>(name: string, schema: z.ZodSchema<T>, description?: string): void {
    if (this.schemas.has(name)) {
      logger.warn(`Schema '${name}' already exists. Overriding...`)
    }

    this.schemas.set(name, {
      name,
      schema,
      description,
      version: '1.0.0'
    })

    logger.debug(`Schema '${name}' registered successfully`)
  }

  getSchema<T>(name: string): z.ZodSchema<T> | null {
    const schemaDef = this.schemas.get(name)
    return schemaDef?.schema as z.ZodSchema<T> || null
  }

  hasSchema(name: string): boolean {
    return this.schemas.has(name)
  }

  listSchemas(): string[] {
    return Array.from(this.schemas.keys())
  }

  // Core validation methods
  validate<T>(
    schemaName: string,
    data: unknown,
    config?: ValidationConfig
  ): ValidationResult<T> {
    const schema = this.getSchema<T>(schemaName)
    if (!schema) {
      const error = new Error(`Schema '${schemaName}' not found`)
      logger.error('Schema not found', { schemaName, availableSchemas: this.listSchemas() })

      if (config?.strategy === 'safe') {
        return { success: false, errors: [{ field: 'schema', message: error.message, code: 'SCHEMA_NOT_FOUND' }] }
      }
      throw error
    }

    logger.debug('Validating data', {
      schemaName,
      dataType: typeof data,
      dataKeys: typeof data === 'object' && data ? Object.keys(data) : undefined
    })

    const result = this.validateWithSchema(schema, data, config)

    if (!result.success) {
      logger.error('Validation failed for schema', {
        schemaName,
        errors: result.errors,
        inputDataSample: typeof data === 'object' ? JSON.stringify(data, null, 2).substring(0, 500) : data
      })
    }

    return result
  }

  validateWithSchema<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    config?: ValidationConfig
  ): ValidationResult<T> {
    const finalConfig = { ...this.defaultConfig, ...config }

    try {
      // Apply different validation modes
      let result: z.SafeParseReturnType<any, T>

      switch (finalConfig.mode) {
        case 'partial':
          if ('partial' in schema) {
            result = (schema as any).partial().safeParse(data)
          } else {
            result = schema.safeParse(data)
          }
          break
        case 'transform':
          result = schema.safeParse(data)
          break
        case 'strict':
        default:
          if ('strict' in schema) {
            result = (schema as any).strict().safeParse(data)
          } else {
            result = schema.safeParse(data)
          }
          break
      }

      if (result.success) {
        logger.debug('Validation successful', { dataKeys: Object.keys(result.data || {}) })
        return {
          success: true,
          data: result.data
        }
      }

      // Process validation errors
      const errors: ValidationErrorDetail[] = result.error.issues.map(issue => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
        code: issue.code,
        received: 'received' in issue ? issue.received : undefined
      }))

      logger.warn('Validation failed', {
        errors,
        inputData: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
        schemaName: 'schema' in schema ? schema.description : 'unknown'
      })

      // Handle based on strategy
      switch (finalConfig.strategy) {
        case 'safe':
          return { success: false, errors }
        case 'middleware':
          throw ApiErrorBuilder.validationError(
            errors.reduce((acc, err) => ({ ...acc, [err.field]: err }), {}),
            'Validation failed'
          )
        case 'throw':
        default:
          throw new ValidationError(
            errors.reduce((acc, err) => ({ ...acc, [err.field]: err }), {}),
            'Validation failed'
          )
      }
    } catch (error) {
      logger.error('Unexpected validation error', { error: (error as Error).message })

      if (finalConfig.strategy === 'safe') {
        return {
          success: false,
          errors: [{
            field: 'unknown',
            message: (error as Error).message,
            code: 'VALIDATION_ERROR'
          }]
        }
      }
      throw error
    }
  }

  // Middleware creation methods
  createMiddleware<T>(
    schemaName: string,
    target: ValidationTarget = 'body',
    config?: ValidationConfig
  ): (req: Request, res: Response, next: NextFunction) => void {
    const schema = this.getSchema<T>(schemaName)
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`)
    }

    return this.createMiddlewareWithSchema(schema, target, config)
  }

  createMiddlewareWithSchema<T>(
    schema: z.ZodSchema<T>,
    target: ValidationTarget = 'body',
    config?: ValidationConfig
  ): (req: Request, res: Response, next: NextFunction) => void {
    const finalConfig = { ...this.defaultConfig, strategy: 'middleware' as ValidationStrategy, ...config }

    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        const dataToValidate = this.extractDataFromRequest(req, target)
        const result = this.validateWithSchema<T>(schema, dataToValidate, finalConfig)

        if (result.success && result.data) {
          // Attach validated data back to request
          this.attachDataToRequest(req, target, result.data)
          logger.debug(`Validation middleware passed for ${target}`)
        }

        next()
      } catch (error) {
        logger.error(`Validation middleware failed for ${target}`, { error: (error as Error).message })
        next(error)
      }
    }
  }

  // Batch validation
  validateMultiple(
    validations: Array<{
      schemaName: string
      target: ValidationTarget
      config?: ValidationConfig
    }>,
    req: Request
  ): ValidationResult<Record<ValidationTarget, any>> {
    const results: Record<ValidationTarget, any> = {} as Record<ValidationTarget, any>
    const allErrors: ValidationErrorDetail[] = []

    for (const validation of validations) {
      const dataToValidate = this.extractDataFromRequest(req, validation.target)
      const result = this.validate(
        validation.schemaName,
        dataToValidate,
        { ...validation.config, strategy: 'safe' }
      )

      if (result.success && result.data) {
        results[validation.target] = result.data
      } else if (result.errors) {
        // Prefix errors with target for clarity
        const targetedErrors = result.errors.map(err => ({
          ...err,
          field: `${validation.target}.${err.field}`
        }))
        allErrors.push(...targetedErrors)
      }
    }

    if (allErrors.length > 0) {
      return { success: false, errors: allErrors }
    }

    return { success: true, data: results }
  }

  // Transform method
  transform<T, U>(
    schemaName: string,
    data: unknown,
    transformer: (data: T) => U,
    config?: ValidationConfig
  ): ValidationResult<U> {
    const validationResult = this.validate<T>(schemaName, data, config)

    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        errors: validationResult.errors
      } as ValidationResult<U>
    }

    try {
      const transformedData = transformer(validationResult.data)
      return { success: true, data: transformedData }
    } catch (error) {
      logger.error('Transformation failed', { error: (error as Error).message })

      if (config?.strategy === 'safe') {
        return {
          success: false,
          errors: [{
            field: 'transform',
            message: (error as Error).message,
            code: 'TRANSFORM_ERROR'
          }]
        }
      }
      throw error
    }
  }

  // Helper methods
  private extractDataFromRequest(req: Request, target: ValidationTarget): unknown {
    switch (target) {
      case 'body':
        return req.body
      case 'query':
        return req.query
      case 'params':
        return req.params
      case 'headers':
        return req.headers
      default:
        throw new Error(`Unsupported validation target: ${target}`)
    }
  }

  private attachDataToRequest(req: Request, target: ValidationTarget, data: any): void {
    switch (target) {
      case 'body':
        req.body = data
        break
      case 'query':
        req.query = data
        break
      case 'params':
        req.params = data
        break
      case 'headers':
        req.headers = data
        break
      default:
        throw new Error(`Unsupported validation target: ${target}`)
    }
  }
}

// Factory function for creating validation instances
export const createValidationFactory = (config?: Partial<ValidationConfig>): ValidationFactory => {
  return new ValidationFactory(config)
}