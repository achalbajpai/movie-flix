import { IBusRepository, ICityRepository, IOperatorRepository } from '@/repositories/interfaces'
import { Bus, SearchQuery, SearchFilters, SearchResultMetadata } from '@/models'
import { BusSearchResult, BusSearchFilters } from '@/models/Database'
import { supabase } from '@/config'
import { transformBusSearchToApi, transformCityName, transformOperatorFromDatabase } from '@/utils'
import { logger } from '@/config'

export class SupabaseBusRepository implements IBusRepository {
  async searchBuses(query: SearchQuery): Promise<{
    buses: Bus[]
    metadata: SearchResultMetadata
  }> {
    const startTime = Date.now()

    try {
      // Build the search query
      let supabaseQuery = supabase
        .from('Schedules')
        .select(`
          schedule_id,
          departure,
          arrival,
          base_price,
          Bus!inner (
            bus_id,
            bus_no,
            bus_type,
            total_seats,
            Operator!inner (
              operator_id,
              company,
              verification
            )
          ),
          Routes!inner (
            route_id,
            source_des,
            drop_des,
            distance,
            approx_time
          )
        `)

      // Apply source and destination filters
      if (query.searchParams.source && query.searchParams.destination) {
        supabaseQuery = supabaseQuery
          .ilike('Routes.source_des', `%${query.searchParams.source}%`)
          .ilike('Routes.drop_des', `%${query.searchParams.destination}%`)
      }

      // Apply date filter (departure date)
      if (query.searchParams.departureDate) {
        const searchDate = new Date(query.searchParams.departureDate)
        const nextDay = new Date(searchDate)
        nextDay.setDate(nextDay.getDate() + 1)

        supabaseQuery = supabaseQuery
          .gte('departure', searchDate.toISOString())
          .lt('departure', nextDay.toISOString())
      }

      // Apply filters
      if (query.filters) {
        // Price range filter
        if (query.filters.priceRange) {
          supabaseQuery = supabaseQuery
            .gte('base_price', query.filters.priceRange.min)
            .lte('base_price', query.filters.priceRange.max)
        }

        // Bus type filter
        if (query.filters.busTypes && query.filters.busTypes.length > 0) {
          supabaseQuery = supabaseQuery.in('Bus.bus_type', query.filters.busTypes)
        }
      }

      // Apply sorting
      if (query.sort) {
        let orderColumn: string
        switch (query.sort.field) {
          case 'price':
            orderColumn = 'base_price'
            break
          case 'departure':
            orderColumn = 'departure'
            break
          case 'arrival':
            orderColumn = 'arrival'
            break
          default:
            orderColumn = 'departure'
        }

        supabaseQuery = supabaseQuery.order(orderColumn, {
          ascending: query.sort.order === 'asc'
        })
      }

      // Apply pagination
      if (query.pagination) {
        const { page, limit } = query.pagination
        const startIndex = (page - 1) * limit
        supabaseQuery = supabaseQuery.range(startIndex, startIndex + limit - 1)
      }

      const { data, error, count } = await supabaseQuery

      if (error) {
        logger.error('Supabase bus search error', { error: error.message })
        throw new Error(`Database query failed: ${error.message}`)
      }

      // Transform the results
      const buses: Bus[] = []

      if (data) {
        for (const row of data) {
          // Get available seats count
          const availableSeats = await this.getAvailableSeatsCount(row.schedule_id)

          const busSearchResult: BusSearchResult = {
            schedule_id: row.schedule_id,
            bus_id: row.Bus.bus_id,
            operator_id: row.Bus.Operator.operator_id,
            bus_no: row.Bus.bus_no,
            bus_type: row.Bus.bus_type,
            company: row.Bus.Operator.company,
            operator_verification: row.Bus.Operator.verification,
            source_des: row.Routes.source_des,
            drop_des: row.Routes.drop_des,
            distance: row.Routes.distance,
            approx_time: row.Routes.approx_time,
            departure: row.departure,
            arrival: row.arrival,
            base_price: row.base_price,
            available_seats: availableSeats,
            total_seats: row.Bus.total_seats
          }

          buses.push(transformBusSearchToApi(busSearchResult))
        }
      }

      const searchTime = Date.now() - startTime

      return {
        buses,
        metadata: {
          totalCount: count || buses.length,
          searchTime,
          appliedFilters: query.filters || {}
        }
      }
    } catch (error) {
      logger.error('Bus search error', { error: (error as Error).message })
      throw error
    }
  }

  async findById(id: string): Promise<Bus | null> {
    try {
      const scheduleId = parseInt(id)

      const { data, error } = await supabase
        .from('Schedules')
        .select(`
          schedule_id,
          departure,
          arrival,
          base_price,
          Bus!inner (
            bus_id,
            bus_no,
            bus_type,
            total_seats,
            Operator!inner (
              operator_id,
              company,
              verification
            )
          ),
          Routes!inner (
            route_id,
            source_des,
            drop_des,
            distance,
            approx_time
          )
        `)
        .eq('schedule_id', scheduleId)
        .single()

      if (error || !data) {
        return null
      }

      const availableSeats = await this.getAvailableSeatsCount(data.schedule_id)

      const busSearchResult: BusSearchResult = {
        schedule_id: data.schedule_id,
        bus_id: data.Bus.bus_id,
        operator_id: data.Bus.Operator.operator_id,
        bus_no: data.Bus.bus_no,
        bus_type: data.Bus.bus_type,
        company: data.Bus.Operator.company,
        operator_verification: data.Bus.Operator.verification,
        source_des: data.Routes.source_des,
        drop_des: data.Routes.drop_des,
        distance: data.Routes.distance,
        approx_time: data.Routes.approx_time,
        departure: data.departure,
        arrival: data.arrival,
        base_price: data.base_price,
        available_seats: availableSeats,
        total_seats: data.Bus.total_seats
      }

      return transformBusSearchToApi(busSearchResult)
    } catch (error) {
      logger.error('Find bus by ID error', { error: (error as Error).message, id })
      throw error
    }
  }

  async findByOperator(operatorId: string): Promise<Bus[]> {
    try {
      const opId = parseInt(operatorId)

      const { data, error } = await supabase
        .from('Schedules')
        .select(`
          schedule_id,
          departure,
          arrival,
          base_price,
          Bus!inner (
            bus_id,
            bus_no,
            bus_type,
            total_seats,
            Operator!inner (
              operator_id,
              company,
              verification
            )
          ),
          Routes!inner (
            route_id,
            source_des,
            drop_des,
            distance,
            approx_time
          )
        `)
        .eq('Bus.operator_id', opId)

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      const buses: Bus[] = []

      if (data) {
        for (const row of data) {
          const availableSeats = await this.getAvailableSeatsCount(row.schedule_id)

          const busSearchResult: BusSearchResult = {
            schedule_id: row.schedule_id,
            bus_id: row.Bus.bus_id,
            operator_id: row.Bus.Operator.operator_id,
            bus_no: row.Bus.bus_no,
            bus_type: row.Bus.bus_type,
            company: row.Bus.Operator.company,
            operator_verification: row.Bus.Operator.verification,
            source_des: row.Routes.source_des,
            drop_des: row.Routes.drop_des,
            distance: row.Routes.distance,
            approx_time: row.Routes.approx_time,
            departure: row.departure,
            arrival: row.arrival,
            base_price: row.base_price,
            available_seats: availableSeats,
            total_seats: row.Bus.total_seats
          }

          buses.push(transformBusSearchToApi(busSearchResult))
        }
      }

      return buses
    } catch (error) {
      logger.error('Find buses by operator error', { error: (error as Error).message, operatorId })
      throw error
    }
  }

  async findByRoute(routeId: string): Promise<Bus[]> {
    try {
      const rId = parseInt(routeId)

      const { data, error } = await supabase
        .from('Schedules')
        .select(`
          schedule_id,
          departure,
          arrival,
          base_price,
          Bus!inner (
            bus_id,
            bus_no,
            bus_type,
            total_seats,
            Operator!inner (
              operator_id,
              company,
              verification
            )
          ),
          Routes!inner (
            route_id,
            source_des,
            drop_des,
            distance,
            approx_time
          )
        `)
        .eq('route_id', rId)

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      const buses: Bus[] = []

      if (data) {
        for (const row of data) {
          const availableSeats = await this.getAvailableSeatsCount(row.schedule_id)

          const busSearchResult: BusSearchResult = {
            schedule_id: row.schedule_id,
            bus_id: row.Bus.bus_id,
            operator_id: row.Bus.Operator.operator_id,
            bus_no: row.Bus.bus_no,
            bus_type: row.Bus.bus_type,
            company: row.Bus.Operator.company,
            operator_verification: row.Bus.Operator.verification,
            source_des: row.Routes.source_des,
            drop_des: row.Routes.drop_des,
            distance: row.Routes.distance,
            approx_time: row.Routes.approx_time,
            departure: row.departure,
            arrival: row.arrival,
            base_price: row.base_price,
            available_seats: availableSeats,
            total_seats: row.Bus.total_seats
          }

          buses.push(transformBusSearchToApi(busSearchResult))
        }
      }

      return buses
    } catch (error) {
      logger.error('Find buses by route error', { error: (error as Error).message, routeId })
      throw error
    }
  }

  async getSearchFilters(query: SearchQuery): Promise<SearchFilters> {
    try {
      // Get available operators
      const { data: operatorData, error: operatorError } = await supabase
        .from('Operator')
        .select('operator_id, company')
        .eq('verification', true)

      if (operatorError) {
        logger.error('Failed to fetch operators for filters', { error: operatorError.message })
      }

      const availableOperators = operatorData?.map(op => ({
        id: `${op.operator_id}`,
        name: op.company,
        busCount: 1 // Would need complex query to get actual count
      })) || []

      // Get available bus types
      const { data: busTypeData, error: busTypeError } = await supabase
        .from('Bus')
        .select('bus_type')
        .not('bus_type', 'is', null)

      if (busTypeError) {
        logger.error('Failed to fetch bus types for filters', { error: busTypeError.message })
      }

      const uniqueBusTypes = [...new Set(busTypeData?.map(b => b.bus_type).filter(Boolean))]
      const availableBusTypes = uniqueBusTypes.map(type => ({
        id: `bt-${type.replace(/\s+/g, '-')}`,
        name: type,
        busCount: 1
      }))

      // Get price range
      const { data: priceData, error: priceError } = await supabase
        .from('Schedules')
        .select('base_price')
        .not('base_price', 'is', null)

      if (priceError) {
        logger.error('Failed to fetch price range for filters', { error: priceError.message })
      }

      const prices = priceData?.map(p => Number(p.base_price)) || []
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 5000
      }

      return {
        availableOperators,
        availableBusTypes,
        priceRange,
        availableAmenities: [
          { id: 'a-ac', name: 'Air Conditioning', busCount: 1 },
          { id: 'a-wifi', name: 'Wi-Fi', busCount: 1 },
          { id: 'a-charging', name: 'Charging Point', busCount: 1 }
        ],
        departureTimeSlots: [
          { slot: 'Morning (6AM-12PM)', busCount: 1 },
          { slot: 'Afternoon (12PM-6PM)', busCount: 1 },
          { slot: 'Evening (6PM-12AM)', busCount: 1 },
          { slot: 'Night (12AM-6AM)', busCount: 1 }
        ]
      }
    } catch (error) {
      logger.error('Get search filters error', { error: (error as Error).message })
      throw error
    }
  }

  async getTotalCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('Bus')
        .select('*', { count: 'exact', head: true })

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      logger.error('Get total count error', { error: (error as Error).message })
      throw error
    }
  }

  async getBusCountByOperator(operatorId: string): Promise<number> {
    try {
      const opId = parseInt(operatorId)

      const { count, error } = await supabase
        .from('Bus')
        .select('*', { count: 'exact', head: true })
        .eq('operator_id', opId)

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      logger.error('Get bus count by operator error', { error: (error as Error).message, operatorId })
      throw error
    }
  }

  private async getAvailableSeatsCount(scheduleId: number): Promise<number> {
    try {
      const { data: seatsData, error: seatsError } = await supabase
        .from('Seats')
        .select('seat_id, is_reserved')
        .eq('schedule_id', scheduleId)

      if (seatsError) {
        logger.error('Failed to get seats data', { error: seatsError.message })
        return 0
      }

      return seatsData?.filter(seat => !seat.is_reserved).length || 0
    } catch (error) {
      logger.error('Get available seats count error', { error: (error as Error).message, scheduleId })
      return 0
    }
  }
}

export class SupabaseCityRepository implements ICityRepository {
  async findAll(): Promise<Array<{ id: string; name: string; state: string }>> {
    try {
      // Get unique cities from Routes table
      const { data: sourceData, error: sourceError } = await supabase
        .from('Routes')
        .select('source_des')

      const { data: destData, error: destError } = await supabase
        .from('Routes')
        .select('drop_des')

      if (sourceError || destError) {
        logger.error('Failed to fetch cities', { sourceError, destError })
        throw new Error('Failed to fetch cities')
      }

      const allCities = new Set<string>()

      sourceData?.forEach(row => allCities.add(row.source_des))
      destData?.forEach(row => allCities.add(row.drop_des))

      return Array.from(allCities)
        .map(city => transformCityName(city))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      logger.error('Find all cities error', { error: (error as Error).message })
      throw error
    }
  }

  async findByQuery(query: string, limit = 10): Promise<Array<{ id: string; name: string; state: string }>> {
    try {
      const allCities = await this.findAll()

      const filtered = allCities
        .filter(city =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.state.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)

      return filtered
    } catch (error) {
      logger.error('Find cities by query error', { error: (error as Error).message, query })
      throw error
    }
  }

  async findById(id: string): Promise<{ id: string; name: string; state: string } | null> {
    try {
      const allCities = await this.findAll()
      return allCities.find(city => city.id === id) || null
    } catch (error) {
      logger.error('Find city by ID error', { error: (error as Error).message, id })
      throw error
    }
  }
}

export class SupabaseOperatorRepository implements IOperatorRepository {
  async findAll(): Promise<Array<{ id: string; name: string; rating: number }>> {
    try {
      const { data, error } = await supabase
        .from('Operator')
        .select('operator_id, company, verification')
        .eq('verification', true)

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return data?.map(op => ({
        id: `${op.operator_id}`,
        name: op.company,
        rating: 4.0 // Default rating - could be calculated from reviews
      })) || []
    } catch (error) {
      logger.error('Find all operators error', { error: (error as Error).message })
      throw error
    }
  }

  async findById(id: string): Promise<{ id: string; name: string; rating: number } | null> {
    try {
      const opId = parseInt(id)

      const { data, error } = await supabase
        .from('Operator')
        .select('operator_id, company, verification')
        .eq('operator_id', opId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: `${data.operator_id}`,
        name: data.company,
        rating: 4.0
      }
    } catch (error) {
      logger.error('Find operator by ID error', { error: (error as Error).message, id })
      throw error
    }
  }

  async findByIds(ids: string[]): Promise<Array<{ id: string; name: string; rating: number }>> {
    try {
      const opIds = ids.map(id => parseInt(id))

      const { data, error } = await supabase
        .from('Operator')
        .select('operator_id, company, verification')
        .in('operator_id', opIds)
        .eq('verification', true)

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return data?.map(op => ({
        id: `${op.operator_id}`,
        name: op.company,
        rating: 4.0
      })) || []
    } catch (error) {
      logger.error('Find operators by IDs error', { error: (error as Error).message, ids })
      throw error
    }
  }
}