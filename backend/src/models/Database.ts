// Database types matching Supabase schema for Movie Booking System

export interface DatabaseUser {
  user_id: string
  name: string | null
  email: string | null
  phone: string | null
  age: number | null
  role: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseTheater {
  theater_id: number
  user_id: string | null
  name: string
  location: string
  address: string | null
  city: string
  state: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  verification: boolean
  created_at?: string
  updated_at?: string
}

export interface DatabaseScreen {
  screen_id: number
  theater_id: number
  screen_name: string
  screen_number: number
  total_seats: number
  screen_type: string // Regular, IMAX, 3D, 4DX, Dolby
  rows: number
  columns: number
  created_at?: string
  updated_at?: string
}

export interface DatabaseMovie {
  movie_id: number
  title: string
  description: string | null
  duration: number // in minutes
  genre: string
  language: string
  rating: string | null // U, UA, A, R, PG-13
  release_date: string
  director: string | null
  actors: string[] | null // Array of actor names
  poster_url: string | null
  trailer_url: string | null
  imdb_rating: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface DatabaseShow {
  show_id: number
  movie_id: number
  screen_id: number
  show_time: string
  end_time: string
  base_price: number
  show_type: string // Regular, IMAX, 3D, 4DX
  language: string | null
  subtitles: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface DatabaseSeat {
  seat_id: number
  show_id: number | null
  seat_no: string
  is_reserved: boolean
  price: number
  reservation_expires_at: string | null
  updated_at?: string
  booking_id: number | null
  row_number: string | null // A, B, C, etc.
  column_number: number | null // 1, 2, 3, etc.
  seat_type: string // Regular, Premium, Recliner
}

export interface DatabaseBooking {
  booking_id: number
  user_id: string | null
  show_id: number | null
  status: string | null
  price: number | null
  total_amt: number | null
  created_at?: string
  updated_at?: string
}

export interface DatabaseBookingSeat {
  booking_id: number
  seat_id: number
  ticket_id: string | null
  customer_name: string | null
  customer_age: number | null
  gender: string | null
  customer_email: string | null
  customer_phone: string | null
}

export interface DatabaseSeatReservation {
  reservation_id: string
  show_id: number
  seat_ids: number[]
  user_id: string
  expires_at: string
  created_at?: string
}

// Extended types for API responses with joined data
export interface TheaterWithDetails extends DatabaseTheater {
  screens?: DatabaseScreen[]
}

export interface ScreenWithDetails extends DatabaseScreen {
  theater?: DatabaseTheater
}

export interface MovieWithDetails extends DatabaseMovie {
  shows?: ShowWithDetails[]
}

export interface ShowWithDetails extends DatabaseShow {
  movie?: DatabaseMovie
  screen?: ScreenWithDetails
  theater?: DatabaseTheater
  seats?: DatabaseSeat[]
  available_seats?: number
}

export interface BookingWithDetails extends DatabaseBooking {
  user?: DatabaseUser
  show?: ShowWithDetails
  booking_seats?: (DatabaseBookingSeat & { seat?: DatabaseSeat })[]
}

// Search and filter types
export interface MovieSearchFilters {
  city?: string
  date?: string
  genre?: string
  language?: string
  rating?: string
  priceMin?: number
  priceMax?: number
  theaters?: number[]
  screenTypes?: string[] // IMAX, 3D, 4DX, Regular
  showTimeStart?: string
  showTimeEnd?: string
  onlyAvailable?: boolean
}

export interface ShowSearchFilters {
  movieId?: number
  theaterId?: number
  screenId?: number
  city?: string
  date?: string
  timeStart?: string
  timeEnd?: string
  screenType?: string
  onlyAvailable?: boolean
}

export interface MovieSearchResult {
  movie_id: number
  title: string
  description: string | null
  duration: number
  genre: string
  language: string
  rating: string | null
  poster_url: string | null
  imdb_rating: number | null
  show_count: number // Number of shows available
  min_price: number // Lowest price available
  theaters: string[] // List of theater names showing this movie
}

export interface ShowSearchResult {
  show_id: number
  movie_id: number
  movie_title: string
  movie_poster: string | null
  movie_duration: number
  movie_genre: string
  movie_rating: string | null
  theater_id: number
  theater_name: string
  theater_location: string
  theater_city: string
  screen_id: number
  screen_name: string
  screen_type: string
  show_time: string
  end_time: string
  base_price: number
  available_seats: number
  total_seats: number
  language: string | null
  subtitles: string | null
}

// API transformation types (used as response interfaces)
export interface Movie {
  id: string
  title: string
  description: string | null
  duration: number
  genre: string
  language: string
  rating: string | null
  releaseDate: string
  director: string | null
  actors: string[]
  posterUrl: string | null
  trailerUrl: string | null
  imdbRating: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Theater {
  id: string
  name: string
  location: string
  address: string | null
  city: string
  state: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  verification: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Screen {
  id: string
  theaterId: string
  screenName: string
  screenNumber: number
  totalSeats: number
  screenType: ScreenType
  rows: number
  columns: number
  createdAt: Date
  updatedAt: Date
}

export interface Show {
  id: string
  movieId: string
  screenId: string
  showTime: string
  endTime: string
  basePrice: number
  showType: ShowType
  language: string | null
  subtitles: string | null
  isActive: boolean
  movie?: Movie
  theater?: Theater
  screen?: Screen
  availableSeats?: number
  createdAt: Date
  updatedAt: Date
}

export enum ScreenType {
  REGULAR = 'Regular',
  IMAX = 'IMAX',
  THREED = '3D',
  FOURDX = '4DX',
  DOLBY = 'Dolby'
}

export enum ShowType {
  REGULAR = 'Regular',
  IMAX = 'IMAX',
  THREED = '3D',
  FOURDX = '4DX',
  DOLBY = 'Dolby'
}

export enum SeatType {
  REGULAR = 'Regular',
  PREMIUM = 'Premium',
  RECLINER = 'Recliner'
}

export enum Genre {
  ACTION = 'Action',
  COMEDY = 'Comedy',
  DRAMA = 'Drama',
  HORROR = 'Horror',
  THRILLER = 'Thriller',
  ROMANCE = 'Romance',
  SCIFI = 'Sci-Fi',
  FANTASY = 'Fantasy',
  ANIMATION = 'Animation',
  DOCUMENTARY = 'Documentary'
}

export enum Rating {
  U = 'U', // Universal
  UA = 'UA', // Parental Guidance
  A = 'A', // Adults Only
  R = 'R', // Restricted
  PG13 = 'PG-13' // Parental Guidance 13+
}

// Domain entity for business logic
export class ShowEntity {
  constructor(
    public readonly id: string,
    public readonly movieId: string,
    public readonly movieTitle: string,
    public readonly theaterId: string,
    public readonly theaterName: string,
    public readonly screenId: string,
    public readonly screenType: ScreenType,
    public readonly showTime: string,
    public readonly endTime: string,
    public readonly basePrice: number,
    public readonly availableSeats: number,
    public readonly totalSeats: number,
    public readonly language: string | null
  ) {}

  public isAvailable(): boolean {
    return this.availableSeats > 0
  }

  public getOccupancyPercentage(): number {
    return ((this.totalSeats - this.availableSeats) / this.totalSeats) * 100
  }

  public isPremiumScreen(): boolean {
    return [ScreenType.IMAX, ScreenType.FOURDX, ScreenType.DOLBY].includes(this.screenType)
  }

  public isShowTimePassed(): boolean {
    return new Date(this.showTime) < new Date()
  }

  public getShowDate(): string {
    return new Date(this.showTime).toLocaleDateString()
  }

  public getShowTimeFormatted(): string {
    return new Date(this.showTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export class MovieEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly duration: number,
    public readonly genre: string,
    public readonly language: string,
    public readonly rating: string | null,
    public readonly imdbRating: number | null,
    public readonly posterUrl: string | null
  ) {}

  public getDurationFormatted(): string {
    const hours = Math.floor(this.duration / 60)
    const minutes = this.duration % 60
    return `${hours}h ${minutes}m`
  }

  public isHighRated(): boolean {
    return this.imdbRating !== null && this.imdbRating >= 7.5
  }

  public getGenreDisplay(): string {
    return this.genre
  }
}
