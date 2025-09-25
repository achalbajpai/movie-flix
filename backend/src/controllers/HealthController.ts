import { Request, Response } from 'express'
import { ResponseBuilder } from '@/utils'
import { asyncHandler } from '@/middleware'
import { env } from '@/config'

export const createHealthController = () => {
  /**
   * Health check endpoint
   * GET /api/v1/health
   */
  const healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: process.cpuUsage()
    }

    res.json(ResponseBuilder.success(healthData, 'System is healthy'))
  })

  /**
   * Readiness check endpoint
   * GET /api/v1/health/ready
   */
  const readinessCheck = asyncHandler(async (req: Request, res: Response) => {
    // In a real application, you'd check:
    // - Database connection
    // - External service availability
    // - Required environment variables

    const checks = {
      database: 'healthy', // Would check actual database connection
      externalServices: 'healthy', // Would check external APIs
      configuration: 'healthy' // Would validate required config
    }

    const allHealthy = Object.values(checks).every(status => status === 'healthy')

    const readinessData = {
      status: allHealthy ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString()
    }

    const statusCode = allHealthy ? 200 : 503

    res.status(statusCode).json(
      ResponseBuilder.success(readinessData, allHealthy ? 'System is ready' : 'System is not ready')
    )
  })

  /**
   * Liveness check endpoint
   * GET /api/v1/health/live
   */
  const livenessCheck = asyncHandler(async (req: Request, res: Response) => {
    // Simple liveness check - if we can respond, we're alive
    const livenessData = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid
    }

    res.json(ResponseBuilder.success(livenessData, 'System is alive'))
  })

  return {
    healthCheck,
    readinessCheck,
    livenessCheck
  }
}