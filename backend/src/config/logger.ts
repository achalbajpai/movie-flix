import winston from 'winston'
import { env } from './environment'

const { combine, timestamp, errors, json, colorize, simple } = winston.format

// Custom format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`
    }
    return `${timestamp} [${level}]: ${message}`
  })
)

// Production format
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

// Console transport
const consoleTransport = new winston.transports.Console({
  format: env.NODE_ENV === 'development' ? devFormat : simple
})

// File transport
const fileTransport = new winston.transports.File({
  filename: env.LOG_FILE_PATH,
  format: prodFormat
})

// Error file transport
const errorFileTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  format: prodFormat
})

const transports = [consoleTransport]

// Add file transports in production
if (env.NODE_ENV === 'production') {
  transports.push(fileTransport, errorFileTransport)
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: prodFormat,
  transports,
  exitOnError: false
})

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs'
const logsDir = 'logs'
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true })
}

export default logger