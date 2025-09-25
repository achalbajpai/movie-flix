export interface ICityService {
  getAllCities(): Promise<Array<{ id: string; name: string; state: string }>>
  searchCities(query: string, limit?: number): Promise<Array<{ id: string; name: string; state: string }>>
  getCityById(id: string): Promise<{ id: string; name: string; state: string }>
  getPopularCities(limit?: number): Promise<Array<{ id: string; name: string; state: string }>>
}