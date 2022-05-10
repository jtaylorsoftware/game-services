import { assert, default as chai } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { DynamoDbGameDao } from '../lib/data/dynamodb'
import { GameService } from '../lib/service'

chai.use(chaiAsPromised)

describe('GameService', () => {
  let dao: sinon.SinonStubbedInstance<DynamoDbGameDao>
  let service: GameService
  beforeEach(() => {
    dao = sinon.createStubInstance(DynamoDbGameDao)
    service = new GameService(dao)
  })
  afterEach(() => {
    sinon.reset()
  })

  describe('getGameByTitle', () => {
    it('should return Game in data when found', () => {
      const game = {
        Title: 'Test Game',
        TimesPlayed: 1,
        AddedDateTime: new Date(),
      }

      dao.findByTitle.resolves(game)
      return assert.eventually.deepEqual(
        service.getGameByTitle('Test Game'),
        { status: 200, data: game },
        'should return game from dao'
      )
    })

    it('should return Failure 404 when dao returns null', () => {
      dao.findByTitle.resolves(null)
      return assert.eventually.propertyVal(
        service.getGameByTitle('Test Game'),
        'status',
        404
      )
    })

    it('should return Failure 500 on dao exceptions', () => {
      dao.findByTitle.rejects({})
      return assert.eventually.propertyVal(
        service.getGameByTitle('Test Game'),
        'status',
        500
      )
    })
  })
})
