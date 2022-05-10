import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { assert, default as chai } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { DaoError } from '../lib/data/dao'
import { DynamoDbGameDao, TABLE_NAME } from '../lib/data/dynamodb'

chai.use(chaiAsPromised)

describe('GameDao', () => {
  let ddbDocClient: DynamoDBDocumentClient
  let dao: DynamoDbGameDao

  beforeEach(() => {
    const ddbClient = new DynamoDBClient({})
    ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
    dao = new DynamoDbGameDao(ddbDocClient)
  })

  afterEach(() => {
    sinon.reset()
  })

  describe('findByTitle', () => {
    it('queries DynamoDB by Title and returns result', async () => {
      const game = {
        Title: 'Test Game',
        TimesPlayed: 1,
        AddedDateTime: new Date(),
      }

      const stub = sinon.stub(ddbDocClient, 'send').resolves({
        Count: 1,
        Items: [game],
      })

      await assert.eventually.equal(
        dao.findByTitle('Test Game'),
        game,
        'Dao should return exactly what DynamoDB returns'
      )

      const ddbInput = stub.lastCall.args[0].input as QueryCommandInput
      assert.equal(
        ddbInput.TableName,
        TABLE_NAME,
        'should use the correct Table'
      )
      assert.include(
        ddbInput.KeyConditionExpression,
        'Title =',
        'should query for the title'
      )
    })

    it('returns null if there are no query results', () => {
      sinon.stub(ddbDocClient, 'send').resolves({
        Count: 0,
        Items: [],
      })

      return assert.eventually.equal(
        dao.findByTitle('Test Game'),
        null,
        'Dao should return null when no results'
      )
    })

    it('wraps DynamoDB Errors in DaoError', () => {
      sinon.stub(ddbDocClient, 'send').rejects('ERROR')
      return assert.isRejected(dao.findByTitle('Title'), DaoError)
    })
  })
})
