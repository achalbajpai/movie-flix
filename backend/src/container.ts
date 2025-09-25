import {
  createSupabaseBusRepository,
  createSupabaseCityRepository,
  IBusRepository,
  ICityRepository
} from '@/repositories'

import {
  createBusService,
  createCityService,
  IBusService,
  ICityService
} from '@/services'

import {
  createBusController,
  createCityController,
  createHealthController
} from '@/controllers'

// Container interface for type safety
export interface Container {
  // Repositories
  busRepository: IBusRepository
  cityRepository: ICityRepository

  // Services
  busService: IBusService
  cityService: ICityService

  // Controllers
  busController: ReturnType<typeof createBusController>
  cityController: ReturnType<typeof createCityController>
  healthController: ReturnType<typeof createHealthController>
}

export const createContainer = (): Container => {
  // Repository instances (Data Layer) - Using Supabase for all environments
  const busRepository = createSupabaseBusRepository()
  const cityRepository = createSupabaseCityRepository()

  // Service instances (Business Logic Layer) - Depend on repositories
  const busService = createBusService(busRepository)
  const cityService = createCityService(cityRepository)

  // Controller instances (Presentation Layer) - Depend on services
  const busController = createBusController(busService)
  const cityController = createCityController(cityService)
  const healthController = createHealthController()

  return {
    // Repositories
    busRepository,
    cityRepository,

    // Services
    busService,
    cityService,

    // Controllers
    busController,
    cityController,
    healthController
  }
}

// Singleton pattern for container
let containerInstance: Container | null = null

export const getContainer = (): Container => {
  if (!containerInstance) {
    containerInstance = createContainer()
  }
  return containerInstance
}

// For testing - allows resetting the container
export const resetContainer = (): void => {
  containerInstance = null
}