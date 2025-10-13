import {
  SupabaseMovieRepository,
  SupabaseTheaterRepository,
  SupabaseScreenRepository,
  SupabaseShowRepository,
  SupabaseBookingRepository,
  SupabaseSeatRepository,
  IMovieRepository,
  ITheaterRepository,
  IScreenRepository,
  IShowRepository,
  IBookingRepository,
  ISeatRepository
} from '@/repositories'

import {
  MovieService,
  TheaterService,
  ScreenService,
  ShowService,
  BookingService,
  SeatService,
  EncryptionService,
  IMovieService,
  ITheaterService,
  IScreenService,
  IShowService,
  IBookingService,
  ISeatService,
  IEncryptionService
} from '@/services'

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

// Container interface for type safety
export interface Container {
  // Repositories
  movieRepository: IMovieRepository
  theaterRepository: ITheaterRepository
  screenRepository: IScreenRepository
  showRepository: IShowRepository
  bookingRepository: IBookingRepository
  seatRepository: ISeatRepository

  // Services
  movieService: IMovieService
  theaterService: ITheaterService
  screenService: IScreenService
  showService: IShowService
  bookingService: IBookingService
  seatService: ISeatService
  encryptionService: IEncryptionService

  // Controllers
  movieController: MovieController
  theaterController: TheaterController
  screenController: ScreenController
  showController: ShowController
  healthController: ReturnType<typeof createHealthController>
  bookingController: ReturnType<typeof createBookingController>
  seatController: ReturnType<typeof createSeatController>
  authController: ReturnType<typeof createAuthController>
}

export const createContainer = (): Container => {
  // Repository instances (Data Layer) - Using Supabase for all environments
  const movieRepository = new SupabaseMovieRepository()
  const theaterRepository = new SupabaseTheaterRepository()
  const screenRepository = new SupabaseScreenRepository()
  const showRepository = new SupabaseShowRepository()
  const bookingRepository = new SupabaseBookingRepository()
  const seatRepository = new SupabaseSeatRepository()

  // Service instances (Business Logic Layer) - Depend on repositories
  const encryptionService = new EncryptionService()
  const movieService = new MovieService(movieRepository)
  const theaterService = new TheaterService(theaterRepository)
  const screenService = new ScreenService(screenRepository)
  const showService = new ShowService(showRepository)
  const bookingService = new BookingService(bookingRepository, seatRepository, encryptionService)
  const seatService = new SeatService(seatRepository)

  // Controller instances (Presentation Layer) - Depend on services
  const movieController = new MovieController(movieService)
  const theaterController = new TheaterController(theaterService)
  const screenController = new ScreenController(screenService)
  const showController = new ShowController(showService)
  const healthController = createHealthController()
  const bookingController = createBookingController(bookingService)
  const seatController = createSeatController(seatService)
  const authController = createAuthController()

  return {
    // Repositories
    movieRepository,
    theaterRepository,
    screenRepository,
    showRepository,
    bookingRepository,
    seatRepository,

    // Services
    movieService,
    theaterService,
    screenService,
    showService,
    bookingService,
    seatService,
    encryptionService,

    // Controllers
    movieController,
    theaterController,
    screenController,
    showController,
    healthController,
    bookingController,
    seatController,
    authController
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

export const resetContainer = (): void => {
  containerInstance = null
}
