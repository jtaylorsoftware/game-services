import { ManagementClient, ObjectWithId, User } from 'auth0'
import type { AxiosError } from 'axios'
import axios from 'axios'
import { assert, default as chai } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Game, Success } from 'shared'
import sinon from 'sinon'
import { DaoError } from '../lib/data/dao.js'
import { DynamoDbGameScoreDao } from '../lib/data/dynamodb.js'
import { GameScore } from '../lib/model.js'
import {
  Auth0RequestError,
  Auth0UserService,
  GameQueryService,
  GameScoreService,
} from '../lib/service.js'

chai.use(chaiAsPromised)

describe('Auth0UserService', () => {
  describe('getUserById', () => {
    it('calls auth0 ManagementClient with given id', async () => {
      const stub = sinon.createStubInstance(ManagementClient)
      stub.getUser.callsFake(
        (_: ObjectWithId, cb?: (err: Error, user: User) => void) => {
          return Promise.resolve({
            id: 'abc_123',
            username: 'username',
          } as User)
        }
      )

      const service = new Auth0UserService(stub)
      await assert.eventually.isNotNull(
        service.getUserById(''),
        'getUserById returns something'
      )
      assert.isTrue(
        stub.getUser.calledWith({ id: '' }),
        'getUser was called with id and no cb'
      )
    })

    it("returns a User when there's a matching id", async () => {
      const id = 'abcdef'
      const expected = {
        id,
        username: 'username',
      } as User
      const stub = sinon.createStubInstance(ManagementClient)
      stub.getUser.callsFake(
        (_: ObjectWithId, __?: (err: Error, user: User) => void) => {
          return Promise.resolve(expected)
        }
      )

      const service = new Auth0UserService(stub)
      await assert.eventually.deepEqual(service.getUserById(id), {
        status: 200,
        data: expected,
      })
    })

    it('returns statusCode and message from auth0 when Error contains both', async () => {
      const expected = {
        statusCode: 404,
        message: 'test',
        error: '',
        errorCode: '',
      } as Auth0RequestError
      const stub = sinon.createStubInstance(ManagementClient)
      stub.getUser.callsFake(
        (_: ObjectWithId, __?: (err: Error, user: User) => void) => {
          return Promise.reject(expected)
        }
      )

      const service = new Auth0UserService(stub)
      await assert.eventually.deepEqual(service.getUserById(''), {
        status: expected.statusCode,
        message: expected.message,
      })
    })

    it("returns Failure 500 when there's an unknown Error", async () => {
      const stub = sinon.createStubInstance(ManagementClient)
      stub.getUser.callsFake(
        (_: ObjectWithId, __?: (err: Error, user: User) => void) => {
          return Promise.reject({})
        }
      )

      const service = new Auth0UserService(stub)

      await assert.eventually.propertyVal(
        service.getUserById('title'),
        'status',
        500
      )
    })
  })
})

describe('GameQueryService', () => {
  describe('getGameByTitle', () => {
    it('should return the game from axios response', async () => {
      const expected = {
        Title: 'Game Title',
        AddedDateTime: new Date(),
        TimesPlayed: 0,
      } as Game
      const instance = axios.create()
      const stub = sinon.stub(instance)
      stub.get.callsFake((url: string) => {
        return Promise.resolve({
          data: expected,
        })
      })
      const service = new GameQueryService(stub)
      await assert.eventually.deepEqual(
        service.getGameByTitle(expected.Title),
        {
          status: 200,
          data: expected,
        }
      )
      assert.isTrue(stub.get.calledWith('?title=Game%20Title'))
    })

    it('should return status when axios errors with response & status', async () => {
      const instance = axios.create()
      const stub = sinon.stub(instance)
      stub.get.callsFake((url: string) => {
        return Promise.reject({
          isAxiosError: true,
          response: {
            status: 404,
          },
        } as AxiosError)
      })
      const service = new GameQueryService(stub)
      await assert.eventually.propertyVal(
        service.getGameByTitle('Game'),
        'status',
        404
      )
    })
  })
})

describe('GameScoreService', () => {
  let daoStub: sinon.SinonStubbedInstance<DynamoDbGameScoreDao>
  let usersStub: sinon.SinonStubbedInstance<Auth0UserService>
  let gamesStub: sinon.SinonStubbedInstance<GameQueryService>

  let service: GameScoreService
  beforeEach(() => {
    daoStub = sinon.createStubInstance(DynamoDbGameScoreDao)
    usersStub = sinon.createStubInstance(Auth0UserService)
    gamesStub = sinon.createStubInstance(GameQueryService)

    service = new GameScoreService(daoStub, usersStub, gamesStub)
  })

  afterEach(() => {
    sinon.reset()
  })

  describe('submitScore', async () => {
    it('saves a submission on success and adds id, username, timestamp', async () => {
      const userId = 'auth|user'
      const username = 'testuser'
      usersStub.getUserById.resolves({
        status: 200,
        data: { id: userId, username },
      })

      const gameTitle = 'Test Game'
      gamesStub.getGameByTitle.resolves({
        status: 200,
        data: { Title: gameTitle, AddedDateTime: new Date(), TimesPlayed: 0 },
      })

      const scoreId = 'abcdef123'
      const daoScore = {
        Id: scoreId,
        GameTitle: gameTitle,
        PlayerId: userId,
        PlayerUsername: username,
        Score: 500,
        CreatedDateTime: new Date(),
      }
      const { CreatedDateTime: timestamp, ...expected } = daoScore

      daoStub.save.resolves(daoScore)

      const result = await service.submitScore({
        GameTitle: gameTitle,
        PlayerId: userId,
        Score: 500,
      })

      assert.equal(result.status, 200, 'Result status should be 200 (Success)')

      const { CreatedDateTime, ...score } = (result as Success<GameScore>).data
      assert.isTrue(
        CreatedDateTime instanceof Date,
        'Score should have a CreatedDateTime'
      )
      assert.deepEqual(score, expected, 'Score should have username and an id')
    })

    it("returns Failure when the user doesn't exist", () => {
      usersStub.getUserById.resolves({
        status: 404,
        message: "User doesn't exist",
      })

      return assert.eventually.propertyVal(
        service.submitScore({
          GameTitle: 'Title',
          PlayerId: 'user123',
          Score: 500,
        }),
        'status',
        400
      )
    })

    it("returns Failure when the game doesn't exist", () => {
      usersStub.getUserById.resolves({
        status: 200,
        data: {
          id: 'auth|abcdef',
          username: 'username',
        },
      })

      gamesStub.getGameByTitle.resolves({
        status: 404,
        message: "Game doesn't exist",
      })

      return assert.eventually.propertyVal(
        service.submitScore({
          GameTitle: 'Title',
          PlayerId: 'user123',
          Score: 500,
        }),
        'status',
        400
      )
    })

    it('returns Failure on other Errors being thrown', () => {
      usersStub.getUserById.resolves({
        status: 200,
        data: {
          id: 'auth|abcdef',
          username: 'username',
        },
      })

      gamesStub.getGameByTitle.resolves({
        status: 200,
        data: {
          Title: 'Game',
          AddedDateTime: new Date(),
          TimesPlayed: 0,
        },
      })

      daoStub.save.rejects(new DaoError('error'))

      return assert.eventually.propertyVal(
        service.submitScore({
          GameTitle: 'Title',
          PlayerId: 'user123',
          Score: 500,
        }),
        'status',
        500
      )
    })
  })
})
