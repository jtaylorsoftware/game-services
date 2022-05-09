import { GameScoreDao } from './data/dao.js'
import {
  GameScoreSubmission,
  GameScore,
  BasicUserData,
  UserId,
} from './model.js'
import { Game, isSuccess, Result } from 'shared'
import { ManagementClient } from 'auth0'
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import qs from 'qs'

/**
 * Provides methods to get user data that is necessary to fulfill
 * other business logic. This type does not enable clients to
 * update user data.
 */
export interface UserQueryService {
  /**
   * Looks up a user by their id.
   *
   * @returns Part of the user's public profile data.
   */
  getUserById(id: UserId): Promise<Result<BasicUserData>>
}

export class Auth0UserService implements UserQueryService {
  private auth0: ManagementClient
  constructor(auth0: ManagementClient) {
    this.auth0 = auth0
  }

  async getUserById(id: UserId): Promise<Result<BasicUserData>> {
    try {
      const user = await this.auth0.getUser({ id })
      if (user.username == null) {
        return {
          status: 500,
          message: 'user did not have username field',
        }
      }
      return {
        status: 200,
        data: {
          id,
          username: user.username,
        },
      }
    } catch (error) {
      console.error('Auth0UserService: getUserById request error: ', error)

      if (isAuth0RequestError(error)) {
        return {
          status: error.statusCode,
          message: error.message,
        }
      }

      return {
        status: 500,
        message: 'Internal error',
      }
    }
  }
}

/**
 * The response body of a failing request to Auth0. Inferred
 * from experimentation with the Management API dashboard.
 *
 * TODO: Figure out if there's a concrete type returned by the JS API
 * or if this is really the only way to extract fields safely.
 */
export type Auth0RequestError = {
  statusCode: number

  /**
   * A brief description relating to `statusCode` - usually just the standard HTTP
   * textual representation of `statusCode`.
   */
  error: string

  /**
   * A verbose string explaining what went wrong. This is exactly
   * what was wrong from Auth0's perspective.
   */
  message: string

  /**
   * A brief textual code that categorizes the error type and is practically
   * a summarization of `message`.
   */
  errorCode: string
}

function isAuth0RequestError(error: any): error is Auth0RequestError {
  return (
    typeof error.statusCode === 'number' &&
    typeof error.error === 'string' &&
    typeof error.message === 'string' &&
    typeof error.errorCode === 'string'
  )
}

/**
 * Offers methods to query existing Games.
 */
export class GameQueryService {
  constructor(private _axios: AxiosInstance) {}

  /**
   * Finds a game with the matching title.
   *
   * @returns The game with the title, or `Failure` with status 404 if not found.
   */
  async getGameByTitle(title: string): Promise<Result<Game>> {
    try {
      const response = await this._axios.get(`?${qs.stringify({ title })}`)
      return {
        status: 200,
        data: response.data,
      }
    } catch (error) {
      console.error('GameQueryService: getGameByTitle request error: ', error)

      if (axios.isAxiosError(error) && error.response != null) {
        return {
          status: error.response.status,
          message: 'Bad request',
        }
      }

      return {
        status: 500,
        message: 'Internal error',
      }
    }
  }
}

/**
 * Performs persistence of new GameScores and provides query methods
 * on existing GameScores.
 */
export class GameScoreService {
  constructor(
    private dao: GameScoreDao,
    private users: UserQueryService,
    private games: GameQueryService
  ) {
    this.dao
    this.users
    this.games
  }

  /**
   * Saves a new score, assigning it a unique id and populating fields such as
   * `PlayerUsername`. It also validates the `GameTitle`, ensuring it exists.
   *
   * @param newScore The score to save.
   *
   * @returns The newly created GameScore on success. If there is no game with
   * a matching title, or user with matching id, returns `Failure` with `status` 400.
   */
  async submitScore(newScore: GameScoreSubmission): Promise<Result<GameScore>> {
    const userResult = await this.users.getUserById(newScore.PlayerId)
    if (!isSuccess(userResult)) {
      if (userResult.status === 404) {
        return {
          status: 400,
          message: 'User with the given Id does not exist.',
        }
      } else {
        return {
          status: 500,
          message: 'Internal error',
        }
      }
    }

    const gameResult = await this.games.getGameByTitle(newScore.GameTitle)
    if (!isSuccess(gameResult)) {
      if (gameResult.status === 404) {
        return {
          status: 400,
          message: 'Game with the given Title does not exist.',
        }
      } else {
        return {
          status: 500,
          message: 'Internal error',
        }
      }
    }

    const score = {
      GameTitle: gameResult.data.Title,
      PlayerId: userResult.data.id,
      PlayerUsername: userResult.data.username,
      Score: newScore.Score,
    }

    try {
      const savedScore = await this.dao.save(score)
      return {
        status: 200,
        data: {
          ...savedScore,
        },
      }
    } catch (error) {
      return {
        status: 500,
        message: 'Internal error',
      }
    }
  }

  /**
   *
   * Gets the top scores for a specific game.
   *
   * @param gameTitle The title of the game to get scores for.
   *
   * @param count The number of scores to return.
   *
   * @returns `count` GameScores for the game with the given title, if that game exists.
   * If the game doesn't exist, the call returns `Failure` with `status` 400.
   */
  async getTopScoresForGame(
    gameTitle: string,
    count: number
  ): Promise<Result<GameScore[]>> {
    gameTitle
    count
    return {
      status: 200,
      data: [],
    }
  }
}
