import {
  createSupabaseBusRepository,
  createSupabaseCityRepository,
  SupabaseBookingRepository,
  SupabaseSeatRepository,
  IBusRepository,
  ICityRepository,
  IBookingRepository,
  ISeatRepository
} from '@/repositories'

import {
  createBusService,
  createCityService,
  BookingService,
  SeatService,
  IBusService,
  ICityService,
  IBookingService,
  ISeatService
} from '@/services'

import {
  createBusController,
  createCityController,
  createHealthController,
  createBookingController,
  createSeatController
} from '@/controllers'

// Container interface for type safety
export interface Container {
  // Repositories
  busRepository: IBusRepository
  cityRepository: ICityRepository
  bookingRepository: IBookingRepository
  seatRepository: ISeatRepository

  // Services
  busService: IBusService
  cityService: ICityService
  bookingService: IBookingService
  seatService: ISeatService

  // Controllers
  busController: ReturnType<typeof createBusController>
  cityController: ReturnType<typeof createCityController>
  healthController: ReturnType<typeof createHealthController>
  bookingController: ReturnType<typeof createBookingController>
  seatController: ReturnType<typeof createSeatController>
}

export const createContainer = (): Container => {
  // Repository instances (Data Layer) - Using Supabase for all environments
  const busRepository = createSupabaseBusRepository()
  const cityRepository = createSupabaseCityRepository()
  const bookingRepository = new SupabaseBookingRepository()
  const seatRepository = new SupabaseSeatRepository()

  // Service instances (Business Logic Layer) - Depend on repositories
  const busService = createBusService(busRepository)
  const cityService = createCityService(cityRepository)
  const bookingService = new BookingService(bookingRepository, seatRepository)
  const seatService = new SeatService(seatRepository)

  // Controller instances (Presentation Layer) - Depend on services
  const busController = createBusController(busService)
  const cityController = createCityController(cityService)
  const healthController = createHealthController()
  const bookingController = createBookingController(bookingService)
  const seatController = createSeatController(seatService)

  return {
    // Repositories
    busRepository,
    cityRepository,
    bookingRepository,
    seatRepository,

    // Services
    busService,
    cityService,
    bookingService,
    seatService,

    // Controllers
    busController,
    cityController,
    healthController,
    bookingController,
    seatController
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