// Database types matching Supabase schema

export interface DatabaseUser {
  user_id: string
  name: string | null
  email: string | null
  phone: string | null
  age: number | null
  role: string
}

export interface DatabaseOperator {
  operator_id: number
  user_id: string | null
  company: string
  verification: boolean
}

export interface DatabaseBus {
  bus_id: number
  operator_id: number | null
  bus_no: string
  bus_type: string | null
  total_seats: number
}

export interface DatabaseDriver {
  driver_id: number
  operator_id: number | null
  license: string
  name: string
  phone_no: string | null
  assigned_stat: string | null
}

export interface DatabaseRoute {
  route_id: number
  source_des: string
  drop_des: string
  distance: number | null
  approx_time: string | null
}

export interface DatabaseSchedule {
  schedule_id: number
  bus_id: number | null
  route_id: number | null
  driver_id: number | null
  arrival: string
  departure: string
  base_price: number
}

export interface DatabaseSeat {
  seat_id: number
  schedule_id: number | null
  seat_no: string
  is_reserved: boolean
  price: number
}

export interface DatabaseBooking {
  booking_id: number
  user_id: string | null
  schedule_id: number | null
  status: string | null
  price: number | null
  total_amt: number | null
}

export interface DatabaseBookingSeat {
  booking_id: number
  seat_id: number
  booking_s_id: string | null
  pass_name: string | null
  pass_age: number | null
  gender: string | null
}

// Extended types for API responses with joined data
export interface BusWithDetails extends DatabaseBus {
  operator?: DatabaseOperator
  schedules?: ScheduleWithDetails[]
}

export interface ScheduleWithDetails extends DatabaseSchedule {
  bus?: DatabaseBus
  route?: DatabaseRoute
  driver?: DatabaseDriver
  seats?: DatabaseSeat[]
  operator?: DatabaseOperator
}

export interface RouteWithDetails extends DatabaseRoute {
  schedules?: ScheduleWithDetails[]
}

export interface BookingWithDetails extends DatabaseBooking {
  user?: DatabaseUser
  schedule?: ScheduleWithDetails
  booking_seats?: (DatabaseBookingSeat & { seat?: DatabaseSeat })[]
}

// Search and filter types
export interface BusSearchFilters {
  source?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  passengers?: number
  priceMin?: number
  priceMax?: number
  operators?: number[]
  busTypes?: string[]
  departureTimeStart?: string
  departureTimeEnd?: string
  onlyAvailable?: boolean
}

export interface BusSearchResult {
  schedule_id: number
  bus_id: number
  operator_id: number
  bus_no: string
  bus_type: string | null
  company: string
  operator_verification: boolean
  source_des: string
  drop_des: string
  distance: number | null
  approx_time: string | null
  departure: string
  arrival: string
  base_price: number
  available_seats: number
  total_seats: number
}

// API transformation types (used as response interfaces)
export interface Bus {
  id: string
  operatorId: string
  operatorName: string
  operatorRating: number
  routeId: string
  departureTime: string
  arrivalTime: string
  duration: number
  price: number
  availableSeats: number
  totalSeats: number
  busType: BusType
  amenities: Amenity[]
  images: string[]
  createdAt: Date
  updatedAt: Date
}

export interface BusType {
  id: string
  name: string
  category: 'AC' | 'NON_AC'
  sleeper: boolean
  seatingArrangement: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Amenity {
  id: string
  name: string
  icon: string
  description?: string
  category: AmenityCategory
  createdAt: Date
  updatedAt: Date
}

export enum AmenityCategory {
  COMFORT = 'comfort',
  ENTERTAINMENT = 'entertainment',
  FOOD = 'food',
  SAFETY = 'safety',
  CONNECTIVITY = 'connectivity'
}

export interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
  createdAt: Date
  updatedAt: Date
}

export interface Route {
  id: string
  source: City
  destination: City
  distance: number
  estimatedDuration: number
  createdAt: Date
  updatedAt: Date
}

export interface Operator {
  id: string
  name: string
  rating: number
  totalTrips: number
  establishedYear: number
  contact: OperatorContact
  logo?: string
  createdAt: Date
  updatedAt: Date
}

export interface OperatorContact {
  phone: string
  email: string
  website?: string
  address: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
}

// Domain entity for business logic
export class BusEntity {
  constructor(
    public readonly id: string,
    public readonly operatorId: string,
    public readonly operatorName: string,
    public readonly operatorRating: number,
    public readonly routeId: string,
    public readonly departureTime: string,
    public readonly arrivalTime: string,
    public readonly duration: number,
    public readonly price: number,
    public readonly availableSeats: number,
    public readonly totalSeats: number,
    public readonly busType: BusType,
    public readonly amenities: Amenity[],
    public readonly images: string[]
  ) {}

  public isAvailable(): boolean {
    return this.availableSeats > 0
  }

  public getOccupancyPercentage(): number {
    return ((this.totalSeats - this.availableSeats) / this.totalSeats) * 100
  }

  public hasAmenity(amenityId: string): boolean {
    return this.amenities.some(amenity => amenity.id === amenityId)
  }

  public calculateDurationHours(): number {
    return Math.floor(this.duration / 60)
  }

  public calculateDurationMinutes(): number {
    return this.duration % 60
  }

  public formatDuration(): string {
    const hours = this.calculateDurationHours()
    const minutes = this.calculateDurationMinutes()
    return `${hours}h ${minutes}m`
  }
}