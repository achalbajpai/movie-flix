import { createApp } from './app'
import { env, logger } from '@/config'

const startServer = async (): Promise<void> => {
  try {
    const app = createApp()

    const server = app.listen(env.PORT, () => {
      logger.info('Server started successfully', {
        port: env.PORT,
        environment: env.NODE_ENV,
        version: env.API_VERSION,
        timestamp: new Date().toISOString()
      })

      logger.info('API endpoints available:', {
        health: `http://localhost:${env.PORT}/health`,
        api: `http://localhost:${env.PORT}${env.API_BASE_PATH}/${env.API_VERSION}`,
        docs: `http://localhost:${env.PORT}/`
      })
    })

    // Graceful shutdown handlers
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`)

      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', { error: err.message })
          process.exit(1)
        }

        logger.info('Server closed successfully')
        process.exit(0)
      })

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Force shutdown after 10 seconds')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message })
    process.exit(1)
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer()
}

export { startServer }