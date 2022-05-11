/**
 * The expected properties of each GameScore entity.
 */
export type GameScoreProperty =
  | 'Id'
  | 'GameTitle'
  | 'PlayerId'
  | 'PlayerUsername'
  | 'Score'
  | 'CreatedDateTime'

/**
 * The type of "Id" properties created by our own endpoints.
 */
export type ObjectId = string

/**
 * The type of "Id" properties created by external user services.
 */
export type UserId = string

/**
 * Models an individual score submission for a game. The same
 * user should be able to submit multiple distinct scores.
 */
export interface GameScore extends Record<GameScoreProperty, any> {
  /**
   * The unique id of this score submission.
   */
  Id: ObjectId

  GameTitle: string

  /**
   * The unique id of the player (user) submitting the score.
   */
  PlayerId: UserId

  PlayerUsername: string

  Score: number

  CreatedDateTime: string // Date
}

/**
 * Models a new GameScore being uploaded by a user/player that requires
 * validation and certain fields to be populated.
 */
export type GameScoreSubmission = Omit<
  GameScore,
  'Id' | 'PlayerUsername' | 'CreatedDateTime'
>

/**
 * Minimal identifying information for a user
 * as needed by other non-management services.
 */
export type BasicUserData = {
  id: UserId
  username: string
}
