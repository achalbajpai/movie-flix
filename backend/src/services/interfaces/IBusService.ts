import { Bus, SearchQuery, SearchFilters, SearchResultMetadata } from '@/models'

export interface BusSearchResult {
  buses: Bus[]
  metadata: SearchResultMetadata
  filters: SearchFilters
}

export interface IBusService {
  // Search operations
  searchBuses(query: SearchQuery): Promise<BusSearchResult>

  // Bus operations
  getBusById(id: string): Promise<Bus>
  getBusesByOperator(operatorId: string): Promise<Bus[]>
  getBusesByRoute(routeId: string): Promise<Bus[]>

  // Analytics/Statistics
  getBusStatistics(): Promise<{
    totalBuses: number
    operatorStats: Array<{ operatorId: string; busCount: number }>
  }>
}

export interface IOperatorService {
  getAllOperators(): Promise<Array<{ id: string; name: string; rating: number }>>
  getOperatorById(id: string): Promise<{ id: string; name: string; rating: number }>
}