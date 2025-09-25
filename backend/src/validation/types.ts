import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// Validation target types
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers'

// Validation mode types
export type ValidationMode = 'strict' | 'transform' | 'partial'

// Validation strategy types
export type ValidationStrategy = 'throw' | 'middleware' | 'safe'

// Validation result types
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationErrorDetail[]
}

export interface ValidationErrorDetail {
  field: string
  message: string
  code: string
  received?: any
}

// Validation configuration
export interface ValidationConfig {
  mode?: ValidationMode
  strategy?: ValidationStrategy
  transform?: boolean
  stripUnknown?: boolean
  abortEarly?: boolean
}

// Schema registry types
export interface SchemaDefinition<T = any> {
  name: string
  schema: z.ZodSchema<T>
  description?: string
  version?: string
}

export type SchemaRegistry = Map<string, SchemaDefinition>

// Validation factory interfaces
export interface IValidationFactory {
  // Schema management
  registerSchema<T>(name: string, schema: z.ZodSchema<T>, description?: string): void
  getSchema<T>(name: string): z.ZodSchema<T> | null
  hasSchema(name: string): boolean
  listSchemas(): string[]

  // Validation methods
  validate<T>(
    schemaName: string,
    data: unknown,
    config?: ValidationConfig
  ): ValidationResult<T>

  validateWithSchema<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    config?: ValidationConfig
  ): ValidationResult<T>

  // Middleware creation
  createMiddleware<T>(
    schemaName: string,
    target?: ValidationTarget,
    config?: ValidationConfig
  ): (req: Request, res: Response, next: NextFunction) => void

  createMiddlewareWithSchema<T>(
    schema: z.ZodSchema<T>,
    target?: ValidationTarget,
    config?: ValidationConfig
  ): (req: Request, res: Response, next: NextFunction) => void

  // Batch validation
  validateMultiple(
    validations: Array<{
      schemaName: string
      target: ValidationTarget
      config?: ValidationConfig
    }>,
    req: Request
  ): ValidationResult<Record<ValidationTarget, any>>

  // Transform data
  transform<T, U>(
    schemaName: string,
    data: unknown,
    transformer: (data: T) => U,
    config?: ValidationConfig
  ): ValidationResult<U>
}

// Validator function types
export type ValidatorFunction<T> = (data: unknown) => ValidationResult<T>
export type MiddlewareValidatorFunction = (req: Request, res: Response, next: NextFunction) => void

// Error handler types
export type ValidationErrorHandler = (errors: ValidationErrorDetail[]) => Error