import { BusSearchResult, DatabaseRoute, Bus, City, Operator, Route, BusType, Amenity } from '@/models/Database'

// Transform database bus search result to API Bus format
export const transformBusSearchToApi = (dbBus: BusSearchResult): Bus => {
  return {
    id: `${dbBus.schedule_id}`,
    operatorId: `${dbBus.operator_id}`,
    operatorName: dbBus.company,
    operatorRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating between 3.0-5.0
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
  const allPossibleAmenities = [
    { id: 'a-charging', name: 'Charging Point', icon: 'power', category: 'CONNECTIVITY' },
    { id: 'a-wifi', name: 'WiFi', icon: 'wifi', category: 'CONNECTIVITY' },
    { id: 'a-ac', name: 'Air Conditioning', icon: 'snowflake', category: 'COMFORT' },
    { id: 'a-blanket', name: 'Blanket', icon: 'shield', category: 'COMFORT' },
    { id: 'a-pillow', name: 'Pillow', icon: 'moon', category: 'COMFORT' },
    { id: 'a-reading-light', name: 'Reading Light', icon: 'bulb', category: 'COMFORT' },
    { id: 'a-entertainment', name: 'Entertainment System', icon: 'tv', category: 'ENTERTAINMENT' },
    { id: 'a-gps', name: 'GPS Tracking', icon: 'navigation', category: 'SAFETY' },
    { id: 'a-first-aid', name: 'First Aid Kit', icon: 'heart', category: 'SAFETY' }
  ]

  const selectedAmenities: Amenity[] = []
  const busTypeStr = (busType || '').toLowerCase()

  // Define amenity profiles based on bus type categories
  const amenityProfiles = {
    basic: ['a-charging', 'a-gps'], // Non-AC, regular buses
    standard: ['a-charging', 'a-ac', 'a-gps', 'a-reading-light'], // AC buses
    premium: ['a-charging', 'a-ac', 'a-wifi', 'a-gps', 'a-reading-light', 'a-entertainment'], // Luxury/Volvo buses
    sleeper: ['a-charging', 'a-ac', 'a-blanket', 'a-pillow', 'a-reading-light', 'a-gps'], // Sleeper buses
    premiumSleeper: ['a-charging', 'a-ac', 'a-wifi', 'a-blanket', 'a-pillow', 'a-reading-light', 'a-entertainment', 'a-gps', 'a-first-aid'] // Luxury sleeper
  }

  let selectedProfile: string[] = []

  // Determine amenity profile based on bus type
  if (busTypeStr.includes('volvo') || busTypeStr.includes('luxury') || busTypeStr.includes('premium')) {
    if (busTypeStr.includes('sleeper')) {
      selectedProfile = amenityProfiles.premiumSleeper
    } else {
      selectedProfile = amenityProfiles.premium
    }
  } else if (busTypeStr.includes('sleeper')) {
    selectedProfile = amenityProfiles.sleeper
  } else if (busTypeStr.includes('ac')) {
    selectedProfile = amenityProfiles.standard
  } else {
    selectedProfile = amenityProfiles.basic
  }

  // Add amenities based on selected profile
  selectedProfile.forEach(amenityId => {
    const amenity = allPossibleAmenities.find(a => a.id === amenityId)
    if (amenity) {
      selectedAmenities.push({
        ...amenity,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Amenity)
    }
  })

  // Add safety amenities for all buses (GPS and First Aid are becoming standard)
  const safetyAmenities = ['a-gps']
  if (!busTypeStr.includes('basic') && !busTypeStr.includes('non-ac')) {
    safetyAmenities.push('a-first-aid')
  }

  safetyAmenities.forEach(amenityId => {
    if (!selectedAmenities.some(a => a.id === amenityId)) {
      const amenity = allPossibleAmenities.find(a => a.id === amenityId)
      if (amenity) {
        selectedAmenities.push({
          ...amenity,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Amenity)
      }
    }
  })

  return selectedAmenities
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
  // Comprehensive city-state mapping for Indian cities
  const cityMap: Record<string, { state: string }> = {
    // Major metros
    'mumbai': { state: 'Maharashtra' },
    'delhi': { state: 'Delhi' },
    'new delhi': { state: 'Delhi' },
    'bangalore': { state: 'Karnataka' },
    'bengaluru': { state: 'Karnataka' },
    'chennai': { state: 'Tamil Nadu' },
    'kolkata': { state: 'West Bengal' },
    'hyderabad': { state: 'Telangana' },

    // Maharashtra cities
    'pune': { state: 'Maharashtra' },
    'nagpur': { state: 'Maharashtra' },
    'nashik': { state: 'Maharashtra' },
    'aurangabad': { state: 'Maharashtra' },
    'solapur': { state: 'Maharashtra' },
    'kolhapur': { state: 'Maharashtra' },
    'sangli': { state: 'Maharashtra' },
    'akola': { state: 'Maharashtra' },
    'latur': { state: 'Maharashtra' },
    'ahmednagar': { state: 'Maharashtra' },

    // Karnataka cities
    'mysore': { state: 'Karnataka' },
    'mysuru': { state: 'Karnataka' },
    'mangalore': { state: 'Karnataka' },
    'hubli': { state: 'Karnataka' },
    'dharwad': { state: 'Karnataka' },
    'belgaum': { state: 'Karnataka' },
    'belagavi': { state: 'Karnataka' },
    'gulbarga': { state: 'Karnataka' },
    'kalaburagi': { state: 'Karnataka' },
    'davanagere': { state: 'Karnataka' },
    'bellary': { state: 'Karnataka' },
    'ballari': { state: 'Karnataka' },
    'bijapur': { state: 'Karnataka' },
    'vijayapura': { state: 'Karnataka' },
    'shimoga': { state: 'Karnataka' },
    'shivamogga': { state: 'Karnataka' },

    // Tamil Nadu cities
    'coimbatore': { state: 'Tamil Nadu' },
    'madurai': { state: 'Tamil Nadu' },
    'salem': { state: 'Tamil Nadu' },
    'tiruchirappalli': { state: 'Tamil Nadu' },
    'tirunelveli': { state: 'Tamil Nadu' },
    'erode': { state: 'Tamil Nadu' },
    'vellore': { state: 'Tamil Nadu' },
    'thoothukudi': { state: 'Tamil Nadu' },
    'dindigul': { state: 'Tamil Nadu' },
    'thanjavur': { state: 'Tamil Nadu' },
    'kanchipuram': { state: 'Tamil Nadu' },
    'cuddalore': { state: 'Tamil Nadu' },

    // Gujarat cities
    'ahmedabad': { state: 'Gujarat' },
    'surat': { state: 'Gujarat' },
    'vadodara': { state: 'Gujarat' },
    'rajkot': { state: 'Gujarat' },
    'bhavnagar': { state: 'Gujarat' },
    'jamnagar': { state: 'Gujarat' },
    'junagadh': { state: 'Gujarat' },
    'gandhinagar': { state: 'Gujarat' },
    'anand': { state: 'Gujarat' },
    'bharuch': { state: 'Gujarat' },

    // Rajasthan cities
    'jaipur': { state: 'Rajasthan' },
    'jodhpur': { state: 'Rajasthan' },
    'udaipur': { state: 'Rajasthan' },
    'kota': { state: 'Rajasthan' },
    'bikaner': { state: 'Rajasthan' },
    'ajmer': { state: 'Rajasthan' },
    'alwar': { state: 'Rajasthan' },
    'bharatpur': { state: 'Rajasthan' },
    'pali': { state: 'Rajasthan' },
    'sikar': { state: 'Rajasthan' },

    // Uttar Pradesh cities
    'lucknow': { state: 'Uttar Pradesh' },
    'kanpur': { state: 'Uttar Pradesh' },
    'agra': { state: 'Uttar Pradesh' },
    'varanasi': { state: 'Uttar Pradesh' },
    'meerut': { state: 'Uttar Pradesh' },
    'ghaziabad': { state: 'Uttar Pradesh' },
    'aligarh': { state: 'Uttar Pradesh' },
    'moradabad': { state: 'Uttar Pradesh' },
    'saharanpur': { state: 'Uttar Pradesh' },
    'gorakhpur': { state: 'Uttar Pradesh' },
    'noida': { state: 'Uttar Pradesh' },
    'firozabad': { state: 'Uttar Pradesh' },
    'jhansi': { state: 'Uttar Pradesh' },
    'muzaffarnagar': { state: 'Uttar Pradesh' },
    'mathura': { state: 'Uttar Pradesh' },

    // Madhya Pradesh cities
    'indore': { state: 'Madhya Pradesh' },
    'bhopal': { state: 'Madhya Pradesh' },
    'jabalpur': { state: 'Madhya Pradesh' },
    'gwalior': { state: 'Madhya Pradesh' },
    'ujjain': { state: 'Madhya Pradesh' },
    'sagar': { state: 'Madhya Pradesh' },
    'dewas': { state: 'Madhya Pradesh' },
    'satna': { state: 'Madhya Pradesh' },
    'ratlam': { state: 'Madhya Pradesh' },
    'rewa': { state: 'Madhya Pradesh' },

    // Andhra Pradesh & Telangana cities
    'visakhapatnam': { state: 'Andhra Pradesh' },
    'vijayawada': { state: 'Andhra Pradesh' },
    'guntur': { state: 'Andhra Pradesh' },
    'nellore': { state: 'Andhra Pradesh' },
    'kurnool': { state: 'Andhra Pradesh' },
    'rajahmundry': { state: 'Andhra Pradesh' },
    'tirupati': { state: 'Andhra Pradesh' },
    'anantapur': { state: 'Andhra Pradesh' },
    'kakinada': { state: 'Andhra Pradesh' },
    'eluru': { state: 'Andhra Pradesh' },
    'warangal': { state: 'Telangana' },
    'nizamabad': { state: 'Telangana' },
    'khammam': { state: 'Telangana' },
    'karimnagar': { state: 'Telangana' },

    // Kerala cities
    'kochi': { state: 'Kerala' },
    'thiruvananthapuram': { state: 'Kerala' },
    'kozhikode': { state: 'Kerala' },
    'thrissur': { state: 'Kerala' },
    'kollam': { state: 'Kerala' },
    'palakkad': { state: 'Kerala' },
    'alappuzha': { state: 'Kerala' },
    'malappuram': { state: 'Kerala' },
    'kannur': { state: 'Kerala' },
    'kottayam': { state: 'Kerala' },

    // West Bengal cities
    'howrah': { state: 'West Bengal' },
    'durgapur': { state: 'West Bengal' },
    'asansol': { state: 'West Bengal' },
    'siliguri': { state: 'West Bengal' },
    'bardhaman': { state: 'West Bengal' },
    'burdwan': { state: 'West Bengal' },
    'malda': { state: 'West Bengal' },
    'kharagpur': { state: 'West Bengal' },

    // Punjab cities
    'ludhiana': { state: 'Punjab' },
    'amritsar': { state: 'Punjab' },
    'jalandhar': { state: 'Punjab' },
    'patiala': { state: 'Punjab' },
    'bathinda': { state: 'Punjab' },
    'mohali': { state: 'Punjab' },
    'hoshiarpur': { state: 'Punjab' },
    'batala': { state: 'Punjab' },

    // Haryana cities
    'faridabad': { state: 'Haryana' },
    'gurgaon': { state: 'Haryana' },
    'gurugram': { state: 'Haryana' },
    'panipat': { state: 'Haryana' },
    'ambala': { state: 'Haryana' },
    'yamunanagar': { state: 'Haryana' },
    'rohtak': { state: 'Haryana' },
    'hisar': { state: 'Haryana' },
    'karnal': { state: 'Haryana' },
    'sonipat': { state: 'Haryana' },

    // Odisha cities
    'bhubaneswar': { state: 'Odisha' },
    'cuttack': { state: 'Odisha' },
    'rourkela': { state: 'Odisha' },
    'berhampur': { state: 'Odisha' },
    'sambalpur': { state: 'Odisha' },
    'puri': { state: 'Odisha' },
    'balasore': { state: 'Odisha' },

    // Chhattisgarh cities
    'raipur': { state: 'Chhattisgarh' },
    'bilaspur': { state: 'Chhattisgarh' },
    'korba': { state: 'Chhattisgarh' },
    'durg': { state: 'Chhattisgarh' },
    'bhilai': { state: 'Chhattisgarh' },
    'raigarh': { state: 'Chhattisgarh' },

    // Jharkhand cities
    'ranchi': { state: 'Jharkhand' },
    'jamshedpur': { state: 'Jharkhand' },
    'dhanbad': { state: 'Jharkhand' },
    'bokaro': { state: 'Jharkhand' },
    'deoghar': { state: 'Jharkhand' },
    'hazaribagh': { state: 'Jharkhand' },

    // Assam cities
    'guwahati': { state: 'Assam' },
    'dibrugarh': { state: 'Assam' },
    'silchar': { state: 'Assam' },
    'tezpur': { state: 'Assam' },
    'jorhat': { state: 'Assam' },
    'nagaon': { state: 'Assam' },

    // Bihar cities
    'patna': { state: 'Bihar' },
    'gaya': { state: 'Bihar' },
    'bhagalpur': { state: 'Bihar' },
    'muzaffarpur': { state: 'Bihar' },
    'darbhanga': { state: 'Bihar' },
    'bihar sharif': { state: 'Bihar' },
    'arrah': { state: 'Bihar' },
    'begusarai': { state: 'Bihar' },
    'katihar': { state: 'Bihar' },
    'munger': { state: 'Bihar' },

    // Other states
    'chandigarh': { state: 'Chandigarh' },
    'shimla': { state: 'Himachal Pradesh' },
    'dehradun': { state: 'Uttarakhand' },
    'jammu': { state: 'Jammu and Kashmir' },
    'srinagar': { state: 'Jammu and Kashmir' },
    'goa': { state: 'Goa' },
    'panaji': { state: 'Goa' },
    'margao': { state: 'Goa' },
    'pondicherry': { state: 'Puducherry' },
    'puducherry': { state: 'Puducherry' },
  }

  const cityKey = cityName.toLowerCase().trim()
  const cityInfo = cityMap[cityKey]

  if (!cityInfo) {
    const patterns = [
      { suffix: 'pur', state: 'Uttar Pradesh' },
      { suffix: 'abad', state: 'Gujarat' },
      { suffix: 'nagar', state: 'Maharashtra' },
    ]

    for (const pattern of patterns) {
      if (cityKey.endsWith(pattern.suffix)) {
        return {
          id: `city-${cityKey}`,
          name: cityName,
          state: pattern.state
        }
      }
    }

    return {
      id: `city-${cityKey}`,
      name: cityName,
      state: 'India'
    }
  }

  return {
    id: `city-${cityKey}`,
    name: cityName,
    state: cityInfo.state
  }
}

export const transformOperatorFromDatabase = (operatorName: string, operatorId: number): Operator => {
  const randomRating = Math.round((Math.random() * 2 + 3) * 10) / 10 
  const randomTrips = Math.floor(Math.random() * 500 + 50) 
  const randomYear = Math.floor(Math.random() * 20 + 2000)

  return {
    id: `${operatorId}`,
    name: operatorName,
    rating: randomRating,
    totalTrips: randomTrips,
    establishedYear: randomYear,
    contact: {
      phone: `+91-${Math.floor(Math.random() * 9000000000 + 1000000000)}`, // Random 10-digit number
      email: `info@${operatorName.toLowerCase().replace(/\s+/g, '').slice(0,10)}travels.com`,
      address: {
        street: `${operatorName} Bus Terminal`,
        city: 'Bangalore', // Could be dynamic based on route
        state: 'Karnataka',
        country: 'India',
        zipCode: `${Math.floor(Math.random() * 900000 + 100000)}` // Random 6-digit zipcode
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
}