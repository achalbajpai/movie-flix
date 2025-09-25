import { Router } from 'express'
import { createBusRoutes } from './busRoutes'
import { createCityRoutes } from './cityRoutes'
import { createHealthRoutes } from './healthRoutes'
import { createBusController, createCityController, createHealthController } from '@/controllers'

export interface RouteControllers {
  busController: ReturnType<typeof createBusController>
  cityController: ReturnType<typeof createCityController>
  healthController: ReturnType<typeof createHealthController>
}

export const createApiRoutes = (controllers: RouteControllers): Router => {
  const router = Router()

  // Health routes (no versioning needed for health checks)
  router.use('/health', createHealthRoutes(controllers.healthController))

  // API v1 routes
  const v1Router = Router()

  // Mount resource routes
  v1Router.use('/buses', createBusRoutes(controllers.busController))
  v1Router.use('/cities', createCityRoutes(controllers.cityController))

  // Mount versioned routes
  router.use('/api/v1', v1Router)

  return router
}

export * from './busRoutes'
export * from './cityRoutes'
export * from './healthRoutes'