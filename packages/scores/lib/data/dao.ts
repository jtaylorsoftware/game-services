import { GameScore } from '../model.js'

/**
 * Basic Error type thrown by GameScoreDao.
 */
export class DaoError extends Error {
  constructor(message: string, public wrapped?: unknown) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Encapsulates methods for persisting and querying Game scores.
 */
export interface GameScoreDao {
  /**
   * Saves a new score for a game. The score submission should not
   * have an id, as it will have one assigned to it.
   *
   * @param score The score to save, which will have an id assigned.
   *
   * @returns The created GameScore.
   */
  save(score: Omit<GameScore, 'Id' | 'CreatedDateTime'>): Promise<GameScore>

  /**
   * Gets a list of scores that have been submitted for a game.
   *
   * @param gameTitle The title of the game to get scores for.
   * @param count The number of scores to return.
   * @param ascending The sort order for the returned scores.
   *
   * @returns A list of {@link GameScore} for the given game, ordered
   * starting from either the highest or lowest score for the game.
   */
  getByGame(
    gameTitle: string,
    count: number,
    ascending?: boolean
  ): Promise<GameScore[]>
}
