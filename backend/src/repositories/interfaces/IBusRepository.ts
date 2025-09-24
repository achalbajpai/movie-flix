import { Bus, SearchQuery, SearchFilters, SearchResultMetadata } from '@/models'

export interface IBusRepository {
  // Search operations
  searchBuses(query: SearchQuery): Promise<{
    buses: Bus[]
    metadata: SearchResultMetadata
  }>

  // Bus operations
  findById(id: string): Promise<Bus | null>
  findByOperator(operatorId: string): Promise<Bus[]>
  findByRoute(routeId: string): Promise<Bus[]>

  // Filter operations
  getSearchFilters(query: SearchQuery): Promise<SearchFilters>

  // Statistics
  getTotalCount(): Promise<number>
  getBusCountByOperator(operatorId: string): Promise<number>
}

export interface ICityRepository {
  findAll(): Promise<Array<{ id: string; name: string; state: string }>>
  findByQuery(query: string, limit?: number): Promise<Array<{ id: string; name: string; state: string }>>
  findById(id: string): Promise<{ id: string; name: string; state: string } | null>
}

export interface IOperatorRepository {
  findAll(): Promise<Array<{ id: string; name: string; rating: number }>>
  findById(id: string): Promise<{ id: string; name: string; rating: number } | null>
  findByIds(ids: string[]): Promise<Array<{ id: string; name: string; rating: number }>>
}