// Main API exports - re-exports from modular structure
export * from './client'
export * from './movie'
export * from './theater'
export * from './show'
export * from './booking'
export * from './seat'
export * from './health'

// Simplified API
export { api } from './simplified'

// Default export for backwards compatibility
export { apiClient as default } from './client'