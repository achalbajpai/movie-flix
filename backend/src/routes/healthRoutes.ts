import { Router } from 'express'
import { HealthController } from '@/controllers'

export const createHealthRoutes = (healthController: HealthController): Router => {
  const router = Router()

  // Basic health check
  router.get('/', healthController.healthCheck)

  // Readiness probe
  router.get('/ready', healthController.readinessCheck)

  // Liveness probe
  router.get('/live', healthController.livenessCheck)

  return router
}