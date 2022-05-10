import { Result, Game } from 'shared'
import { GameDao } from './data/dao.js'

/**
 * Encapsulates methods to find existing Games.
 */
export class GameService {
  constructor(private dao: GameDao) {}

  /**
   * Looks up a game by its exact title.
   *
   * @param title The title to search by.
   *
   * @returns Success when a Game is found, or Failure (`status` 404) when
   * not found.
   */
  async getGameByTitle(title: string): Promise<Result<Game>> {
    try {
      const game = await this.dao.findByTitle(title)
      if (game != null) {
        return {
          status: 200,
          data: game,
        }
      } else {
        return {
          status: 404,
          message: 'Not found',
        }
      }
    } catch (error) {
      console.error('GameService getGameByTitle error:', error)
      return {
        status: 500,
        message: 'Internal error',
      }
    }
  }
}
