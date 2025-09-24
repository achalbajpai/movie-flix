import { IBusService, BusSearchResult } from '@/services/interfaces'
import { IBusRepository } from '@/repositories/interfaces'
import { Bus, SearchQuery, BusEntity } from '@/models'
import { CustomError } from '@/middleware'
import { logger } from '@/config'

export class BusService implements IBusService {
  constructor(private readonly busRepository: IBusRepository) {}

  async searchBuses(query: SearchQuery): Promise<BusSearchResult> {
    try {
      logger.info('Searching buses', { query })

      // Validate search dates
      this.validateSearchDates(query.searchParams.departureDate, query.searchParams.returnDate)

      // Perform search
      const { buses, metadata } = await this.busRepository.searchBuses(query)

      // Get available filters for the search
      const filters = await this.busRepository.getSearchFilters(query)

      // Apply business logic transformations
      const transformedBuses = buses.map(bus => this.enrichBusData(bus))

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

  async getBusById(id: string): Promise<Bus> {
    try {
      logger.info('Fetching bus by ID', { busId: id })

      const bus = await this.busRepository.findById(id)

      if (!bus) {
        throw new CustomError(`Bus with ID ${id} not found`, 404)
      }

      return this.enrichBusData(bus)
    } catch (error) {
      logger.error('Error fetching bus by ID', { error: (error as Error).message, busId: id })
      throw error
    }
  }

  async getBusesByOperator(operatorId: string): Promise<Bus[]> {
    try {
      logger.info('Fetching buses by operator', { operatorId })

      const buses = await this.busRepository.findByOperator(operatorId)
      return buses.map(bus => this.enrichBusData(bus))
    } catch (error) {
      logger.error('Error fetching buses by operator', { error: (error as Error).message, operatorId })
      throw error
    }
  }

  async getBusesByRoute(routeId: string): Promise<Bus[]> {
    try {
      logger.info('Fetching buses by route', { routeId })

      const buses = await this.busRepository.findByRoute(routeId)
      return buses.map(bus => this.enrichBusData(bus))
    } catch (error) {
      logger.error('Error fetching buses by route', { error: (error as Error).message, routeId })
      throw error
    }
  }

  async getBusStatistics(): Promise<{
    totalBuses: number
    operatorStats: Array<{ operatorId: string; busCount: number }>
  }> {
    try {
      logger.info('Fetching bus statistics')

      const totalBuses = await this.busRepository.getTotalCount()

      // For now, we'll use mock operator stats
      // In a real implementation, this would aggregate data from the database
      const operatorStats = [
        { operatorId: 'op-1', busCount: 2 },
        { operatorId: 'op-2', busCount: 1 }
      ]

      return {
        totalBuses,
        operatorStats
      }
    } catch (error) {
      logger.error('Error fetching bus statistics', { error: (error as Error).message })
      throw error
    }
  }

  private validateSearchDates(departureDate: string, returnDate?: string): void {
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

  private enrichBusData(bus: Bus): Bus {
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

  private applyBusinessRules(buses: Bus[]): Bus[] {
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
}