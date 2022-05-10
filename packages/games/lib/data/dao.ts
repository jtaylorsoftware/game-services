import { Game } from 'shared'

/**
 * Basic Error type thrown by GameDao.
 */
export class DaoError extends Error {
  constructor(message: string, public wrapped?: unknown) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Provides methods for clients to query existing Games.
 */
export interface GameDao {
  /**
   * Finds a game with a title that exactly matches the given title.
   *
   * @param title The title to look up.
   *
   * @returns The Game if it exists, or null if not found.
   */
  findByTitle(title: string): Promise<Game | null>
}
