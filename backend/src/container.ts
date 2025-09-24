import {
  SupabaseBusRepository,
  SupabaseCityRepository,
  IBusRepository,
  ICityRepository
} from '@/repositories'

import {
  BusService,
  CityService,
  IBusService,
  ICityService
} from '@/services'

import {
  BusController,
  CityController,
  HealthController
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
  busController: BusController
  cityController: CityController
  healthController: HealthController
}

export const createContainer = (): Container => {
  // Repository instances (Data Layer) - Using Supabase for all environments
  const busRepository = new SupabaseBusRepository()
  const cityRepository = new SupabaseCityRepository()

  // Service instances (Business Logic Layer) - Depend on repositories
  const busService = new BusService(busRepository)
  const cityService = new CityService(cityRepository)

  // Controller instances (Presentation Layer) - Depend on services
  const busController = new BusController(busService)
  const cityController = new CityController(cityService)
  const healthController = new HealthController()

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