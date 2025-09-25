import { City } from '@/models'

export interface ICityRepository {
  findAll(): Promise<City[]>
  findByQuery(query: string, limit?: number): Promise<City[]>
  findById(id: string): Promise<City | null>
  findByIds(ids: string[]): Promise<City[]>
  findPopularCities(limit?: number): Promise<City[]>
}