import { Router } from 'express'
import { createHealthController } from '@/controllers'

export const createHealthRoutes = (healthController: ReturnType<typeof createHealthController>): Router => {
  const router = Router()

  // Basic health check
  router.get('/', healthController.healthCheck)

  // Readiness probe
  router.get('/ready', healthController.readinessCheck)

  // Liveness probe
  router.get('/live', healthController.livenessCheck)

  return router
}