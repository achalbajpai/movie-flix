// Main API exports - re-exports from modular structure
export * from './client'
export * from './bus'
export * from './booking'
export * from './seat'
export * from './location'
export * from './health'
export * from './simplified'

// Default export for backwards compatibility
export { apiClient as default } from './client'