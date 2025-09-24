export interface Bus {
  id: string
  operatorId: string
  operatorName: string
  operatorRating: number
  routeId: string
  departureTime: string
  arrivalTime: string
  duration: number // in minutes
  price: number
  availableSeats: number
  totalSeats: number
  busType: BusType
  amenities: Amenity[]
  images: string[]
}

export interface Route {
  id: string
  source: City
  destination: City
  distance: number // in kilometers
  estimatedDuration: number // in minutes
}

export interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export interface Operator {
  id: string
  name: string
  rating: number
  totalTrips: number
  establishedYear: number
  contact: {
    phone: string
    email: string
    website?: string
  }
  logo?: string
}

export interface Amenity {
  id: string
  name: string
  icon: string
  description?: string
}

export interface BusType {
  id: string
  name: string
  category: 'AC' | 'NON_AC'
  sleeper: boolean
  seatingArrangement: string // e.g., "2+2", "2+1"
  description?: string
}

export interface SearchParams {
  source: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
}

export interface FilterParams {
  priceRange: {
    min: number
    max: number
  }
  operators: string[]
  busTypes: string[]
  departureTimeRange: {
    start: string // HH:MM format
    end: string // HH:MM format
  }
  amenities: string[]
  rating: number
}

export interface SortOption {
  field: 'price' | 'duration' | 'rating' | 'departure' | 'arrival'
  order: 'asc' | 'desc'
}

export interface SearchResult {
  buses: Bus[]
  totalCount: number
  filters: {
    availableOperators: Operator[]
    availableBusTypes: BusType[]
    priceRange: { min: number; max: number }
    availableAmenities: Amenity[]
  }
}