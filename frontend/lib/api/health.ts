import { apiClient, ApiResponse } from './client'

export interface HealthStatus {
  status: 'ok' | 'error'
  timestamp: string
  uptime: number
  version: string
  environment: string
  database: {
    status: 'connected' | 'disconnected'
    responseTime?: number
  }
}

export const healthApi = {
  check: () => apiClient.healthCheck()
}