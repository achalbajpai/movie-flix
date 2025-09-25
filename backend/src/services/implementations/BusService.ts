import { IBusService, BusSearchResult } from '@/services/interfaces'
import { IBusRepository } from '@/repositories/interfaces'
import { Bus, SearchQuery, BusEntity } from '@/models'
import { CustomError } from '@/middleware'
import { logger } from '@/config'

export const createBusService = (busRepository: IBusRepository): IBusService => {

  const searchBuses = async (query: SearchQuery): Promise<BusSearchResult> => {
    try {
      logger.info('Searching buses', { query })

      // Validate search dates
      validateSearchDates(query.searchParams.departureDate, query.searchParams.returnDate)

      // Perform search
      const { buses, metadata } = await busRepository.searchBuses(query)

      // Get available filters for the search
      const filters = await busRepository.getSearchFilters(query)

      // Apply business logic transformations
      const transformedBuses = buses.map(bus => enrichBusData(bus))

      logger.info('Bus search completed', {
        totalFound: metadata.totalCount,
        searchTime: metadata.searchTime
      })

      return {
        buses: transformedBuses,
        metadata: {
          ...metadata,
          appliedFilters: query.filters || {}
        },
        filters
      }
    } catch (error) {
      logger.error('Error searching buses', { error: (error as Error).message, query })
      throw error
    }
  }

  const getBusById = async (id: string): Promise<Bus> => {
    try {
      logger.info('Fetching bus by ID', { busId: id })

      const bus = await busRepository.findById(id)

      if (!bus) {
        throw new CustomError(`Bus with ID ${id} not found`, 404)
      }

      return enrichBusData(bus)
    } catch (error) {
      logger.error('Error fetching bus by ID', { error: (error as Error).message, busId: id })
      throw error
    }
  }

  const getBusesByOperator = async (operatorId: string): Promise<Bus[]> => {
    try {
      logger.info('Fetching buses by operator', { operatorId })

      const buses = await busRepository.findByOperator(operatorId)
      return buses.map(bus => enrichBusData(bus))
    } catch (error) {
      logger.error('Error fetching buses by operator', { error: (error as Error).message, operatorId })
      throw error
    }
  }

  const getBusesByRoute = async (routeId: string): Promise<Bus[]> => {
    try {
      logger.info('Fetching buses by route', { routeId })

      const buses = await busRepository.findByRoute(routeId)
      return buses.map(bus => enrichBusData(bus))
    } catch (error) {
      logger.error('Error fetching buses by route', { error: (error as Error).message, routeId })
      throw error
    }
  }

  const getBusStatistics = async (): Promise<{
    totalBuses: number
    operatorStats: Array<{ operatorId: string; busCount: number }>
  }> => {
    try {
      logger.info('Fetching bus statistics')

      const totalBuses = await busRepository.getTotalCount()

      const operatorStats = await busRepository.getOperatorStatistics()

      return {
        totalBuses,
        operatorStats
      }
    } catch (error) {
      logger.error('Error fetching bus statistics', { error: (error as Error).message })
      throw error
    }
  }

  const validateSearchDates = (departureDate: string, returnDate?: string): void => {
    const departure = new Date(departureDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (departure < today) {
      throw new CustomError('Departure date cannot be in the past', 400)
    }

    if (returnDate) {
      const returnDateObj = new Date(returnDate)
      if (returnDateObj < departure) {
        throw new CustomError('Return date cannot be before departure date', 400)
      }
    }
  }

  const enrichBusData = (bus: Bus): Bus => {
    // Create business entity to access domain methods
    const busEntity = new BusEntity(
      bus.id,
      bus.operatorId,
      bus.operatorName,
      bus.operatorRating,
      bus.routeId,
      bus.departureTime,
      bus.arrivalTime,
      bus.duration,
      bus.price,
      bus.availableSeats,
      bus.totalSeats,
      bus.busType,
      bus.amenities,
      bus.images
    )

    // Add computed properties
    const enrichedBus: Bus = {
      ...bus,
      // You could add computed fields here
      // For example: formattedDuration: busEntity.formatDuration(),
      // occupancyPercentage: busEntity.getOccupancyPercentage()
    }

    return enrichedBus
  }

  const applyBusinessRules = (buses: Bus[]): Bus[] => {
    return buses
      .filter(bus => {
        // Business rule: Only show buses with at least 1 available seat
        return bus.availableSeats > 0
      })
      .map(bus => {
        // Business rule: Mark buses as "filling fast" if less than 20% seats available
        const occupancyPercentage = ((bus.totalSeats - bus.availableSeats) / bus.totalSeats) * 100

        return {
          ...bus,
          // You could add business-specific properties here
          // fillingFast: occupancyPercentage > 80
        }
      })
  }

  return {
    searchBuses,
    getBusById,
    getBusesByOperator,
    getBusesByRoute,
    getBusStatistics
  }
}