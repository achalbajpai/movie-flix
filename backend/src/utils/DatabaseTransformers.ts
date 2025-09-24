import { BusSearchResult, DatabaseRoute, Bus, City, Operator, Route, BusType, Amenity } from '@/models/Database'

// Transform database bus search result to API Bus format
export const transformBusSearchToApi = (dbBus: BusSearchResult): Bus => {
  return {
    id: `${dbBus.schedule_id}`,
    operatorId: `${dbBus.operator_id}`,
    operatorName: dbBus.company,
    operatorRating: 4.0, // Default rating - could be calculated from reviews
    routeId: `route-${dbBus.bus_id}`, // You might want to include route_id in the query
    departureTime: new Date(dbBus.departure).toTimeString().slice(0, 5),
    arrivalTime: new Date(dbBus.arrival).toTimeString().slice(0, 5),
    duration: calculateDuration(dbBus.departure, dbBus.arrival),
    price: Number(dbBus.base_price),
    availableSeats: dbBus.available_seats,
    totalSeats: dbBus.total_seats,
    busType: transformBusType(dbBus.bus_type),
    amenities: getDefaultAmenities(dbBus.bus_type), // You might want to create amenities table
    images: [], // You might want to add images table
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Transform database route to API route
export const transformRouteToApi = (dbRoute: DatabaseRoute): Route => {
  return {
    id: `${dbRoute.route_id}`,
    source: {
      id: `src-${dbRoute.route_id}`,
      name: dbRoute.source_des,
      state: 'Unknown', // You might want to create cities table with state info
      country: 'India',
      latitude: 0,
      longitude: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    destination: {
      id: `dst-${dbRoute.route_id}`,
      name: dbRoute.drop_des,
      state: 'Unknown',
      country: 'India',
      latitude: 0,
      longitude: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    distance: Number(dbRoute.distance) || 0,
    estimatedDuration: parseTimeToMinutes(dbRoute.approx_time),
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Helper functions
function calculateDuration(departure: string, arrival: string): number {
  const dep = new Date(departure)
  const arr = new Date(arrival)
  return Math.floor((arr.getTime() - dep.getTime()) / (1000 * 60)) // minutes
}

function transformBusType(busType: string | null): BusType {
  const type = busType?.toLowerCase() || 'non-ac'

  return {
    id: `bt-${type.replace(/\s+/g, '-')}`,
    name: busType || 'Standard',
    category: type.includes('ac') ? 'AC' : 'NON_AC',
    sleeper: type.includes('sleeper'),
    seatingArrangement: type.includes('sleeper') ? '2+1' : '2+2',
    description: busType || 'Standard bus',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function getDefaultAmenities(busType: string | null): Amenity[] {
  const baseAmenities: Amenity[] = [
    {
      id: 'a-charging',
      name: 'Charging Point',
      icon: 'power',
      category: 'CONNECTIVITY' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  if (busType?.toLowerCase().includes('ac')) {
    baseAmenities.push({
      id: 'a-ac',
      name: 'Air Conditioning',
      icon: 'snowflake',
      category: 'COMFORT' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  return baseAmenities
}

function parseTimeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0

  // Parse formats like "6:30", "6h 30m", etc.
  const hourMatch = timeStr.match(/(\d+)h?/)
  const minuteMatch = timeStr.match(/(\d+)m/)

  const hours = hourMatch ? parseInt(hourMatch[1]) : 0
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0

  return hours * 60 + minutes
}

// City transformation helpers
export const transformCityName = (cityName: string): { id: string; name: string; state: string } => {
  // This would ideally be from a cities lookup table
  const cityMap: Record<string, { state: string }> = {
    'mumbai': { state: 'Maharashtra' },
    'pune': { state: 'Maharashtra' },
    'bangalore': { state: 'Karnataka' },
    'delhi': { state: 'Delhi' },
    'hyderabad': { state: 'Telangana' },
    'chennai': { state: 'Tamil Nadu' },
    'kolkata': { state: 'West Bengal' },
    'ahmedabad': { state: 'Gujarat' },
    'jaipur': { state: 'Rajasthan' },
    'lucknow': { state: 'Uttar Pradesh' }
  }

  const cityKey = cityName.toLowerCase()
  const cityInfo = cityMap[cityKey] || { state: 'Unknown' }

  return {
    id: `city-${cityKey}`,
    name: cityName,
    state: cityInfo.state
  }
}

// Operator transformation
export const transformOperatorFromDatabase = (operatorName: string, operatorId: number): Operator => {
  return {
    id: `${operatorId}`,
    name: operatorName,
    rating: 4.0, // Default rating - could be calculated
    totalTrips: 100, // Default - could be calculated
    establishedYear: 2010, // Default
    contact: {
      phone: '+91-1234567890',
      email: `contact@${operatorName.toLowerCase().replace(/\s+/g, '')}.com`,
      address: {
        street: 'Bus Terminal',
        city: 'City',
        state: 'State',
        country: 'India',
        zipCode: '000000'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
}