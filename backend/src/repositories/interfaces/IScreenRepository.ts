import {
  DatabaseScreen,
  ScreenWithDetails
} from '@/models/Database'

export interface IScreenRepository {
  /**
   * Find screen by ID
   */
  findById(screenId: number): Promise<ScreenWithDetails | null>

  /**
   * Find all screens for a theater
   */
  findByTheater(theaterId: number): Promise<DatabaseScreen[]>

  /**
   * Find screens by type
   */
  findByType(screenType: string): Promise<DatabaseScreen[]>

  /**
   * Get screen capacity
   */
  getCapacity(screenId: number): Promise<number>

  /**
   * Get all screen types
   */
  getScreenTypes(): Promise<string[]>
}
