import { Router } from 'express'
import { createMovieRoutes } from './movieRoutes'
import { createTheaterRoutes } from './theaterRoutes'
import { createScreenRoutes } from './screenRoutes'
import { createShowRoutes } from './showRoutes'
import { createHealthRoutes } from './healthRoutes'
import { createBookingRoutes } from './bookingRoutes'
import { createSeatRoutes } from './seatRoutes'
import { createAuthRoutes } from './authRoutes'
import {
  MovieController,
  TheaterController,
  ScreenController,
  ShowController,
  createHealthController,
  createBookingController,
  createSeatController,
  createAuthController
} from '@/controllers'

export interface RouteControllers {
  movieController: MovieController
  theaterController: TheaterController
  screenController: ScreenController
  showController: ShowController
  healthController: ReturnType<typeof createHealthController>
  bookingController: ReturnType<typeof createBookingController>
  seatController: ReturnType<typeof createSeatController>
  authController: ReturnType<typeof createAuthController>
}

export const createApiRoutes = (controllers: RouteControllers): Router => {
  const router = Router()

  // Health routes (no versioning needed for health checks)
  router.use('/health', createHealthRoutes(controllers.healthController))

  // API v1 routes
  const v1Router = Router()

  // Mount resource routes
  v1Router.use('/movies', createMovieRoutes(controllers.movieController))
  v1Router.use('/theaters', createTheaterRoutes(controllers.theaterController))
  v1Router.use('/screens', createScreenRoutes(controllers.screenController))
  v1Router.use('/shows', createShowRoutes(controllers.showController))
  v1Router.use('/bookings', createBookingRoutes(controllers.bookingController))
  v1Router.use('/seats', createSeatRoutes(controllers.seatController))
  v1Router.use('/auth', createAuthRoutes(controllers.authController))

  // Mount versioned routes
  router.use('/api/v1', v1Router)

  return router
}

export * from './movieRoutes'
export * from './theaterRoutes'
export * from './screenRoutes'
export * from './showRoutes'
export * from './healthRoutes'
export * from './bookingRoutes'
export * from './seatRoutes'
export * from './authRoutes'
