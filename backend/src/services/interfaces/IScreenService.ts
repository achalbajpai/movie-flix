import {
  DatabaseScreen,
  ScreenWithDetails
} from '@/models/Database'

export interface IScreenService {
  /**
   * Get screen by ID with theater details
   */
  getScreenById(screenId: number): Promise<ScreenWithDetails | null>

  /**
   * Get all screens for a theater
   */
  getScreensByTheater(theaterId: number): Promise<DatabaseScreen[]>

  /**
   * Get screens by type (IMAX, 3D, etc.)
   */
  getScreensByType(screenType: string): Promise<DatabaseScreen[]>

  /**
   * Get screen capacity
   */
  getScreenCapacity(screenId: number): Promise<number>

  /**
   * Get all available screen types
   */
  getScreenTypes(): Promise<string[]>
}
