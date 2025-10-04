import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { env, logger } from '@/config'
import {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejections,
  handleUncaughtExceptions,
  handleGracefulShutdown
} from '@/middleware'
import { createApiRoutes } from '@/routes'
import { getContainer } from './container'

export const createApp = (): Application => {
  const app = express()

  // Get dependency container
  const container = getContainer()

  // Trust proxy for rate limiting and IP detection
  app.set('trust proxy', 1)

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }))

  // CORS configuration
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }))

  // Compression middleware
  app.use(compression())

  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000, // Convert minutes to ms
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      })
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.'
        },
        timestamp: new Date().toISOString()
      })
    }
  })

  app.use(limiter)

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Request logging
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    next()
  })

  // API Routes
  app.use('/', createApiRoutes({
    movieController: container.movieController,
    theaterController: container.theaterController,
    screenController: container.screenController,
    showController: container.showController,
    healthController: container.healthController,
    bookingController: container.bookingController,
    seatController: container.seatController,
    authController: container.authController
  }))

  // Welcome route
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Movie Booking System API',
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      docs: '/api/v1',
      health: '/health'
    })
  })

  // 404 handler - must come after all routes
  app.use(notFoundHandler)

  // Global error handler - must come last
  app.use(errorHandler)

  return app
}

// Setup process handlers
handleUnhandledRejections()
handleUncaughtExceptions()
handleGracefulShutdown()