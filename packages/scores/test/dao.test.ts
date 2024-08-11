import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommandInput,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { assert, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { DaoError } from '../lib/data/dao.js'
import {
  DynamoDbGameScoreDao,
  GlobalIndices,
  TABLE_NAME,
} from '../lib/data/dynamodb.js'
import { GameScore } from '../lib/model.js'
import sinon from 'sinon'

use(chaiAsPromised)

describe('DynamoDbGameScoreDao', () => {
  let ddbDocClient: DynamoDBDocumentClient
  let dao: DynamoDbGameScoreDao

  beforeEach(() => {
    const ddbClient = new DynamoDBClient({})
    ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
    dao = new DynamoDbGameScoreDao(ddbDocClient)
  })

  afterEach(() => {
    sinon.reset()
  })

  describe('save', () => {
    it('adds a unique id and timestamp to the GameScore and returns it', async () => {
      const score = {
        GameTitle: 'Test',
        PlayerId: 'id',
        PlayerUsername: 'username',
        Score: 500,
      }

      const stub = sinon.stub(ddbDocClient, 'send').resolves({})

      const savedScore = await dao.save(score)

      assert.isDefined(savedScore.Id, 'save should add an id')
      assert.isDefined(
        savedScore.CreatedDateTime,
        'save should add a timestamp'
      )
      assert.isTrue(stub.calledOnce, 'ddb client should be called')

      const ddbInput = stub.lastCall.args[0].input as PutCommandInput
      const inputScore = ddbInput.Item as GameScore
      assert.equal(ddbInput.TableName, TABLE_NAME)
      assert.deepEqual(
        inputScore,
        savedScore,
        'saved score and returned score should equal'
      )
    })

    it('wraps DynamoDB errors with DaoError', () => {
      const score: Omit<GameScore, 'Id'> = {
        GameTitle: 'Test',
        PlayerId: 'id',
        PlayerUsername: 'username',
        Score: 500,
        CreatedDateTime: new Date().toISOString(),
      }

      sinon.stub(ddbDocClient, 'send').rejects('ERROR')

      return assert.isRejected(dao.save(score), DaoError)
    })
  })

  describe('getByGame', () => {
    it('queries the GameTitleScore index with gameTitle, count, and ascending', async () => {
      const stub = sinon.stub(ddbDocClient, 'send').resolves([{}, {}])

      const title = 'Game Title'
      const ascending = false
      const count = 10
      await dao.getByGame(title, count, ascending)

      const ddbInput = stub.lastCall.args[0].input as QueryCommandInput

      assert.equal(
        ddbInput.TableName,
        TABLE_NAME,
        'should use the correct Table'
      )
      assert.equal(
        ddbInput.IndexName,
        GlobalIndices.GameTitleScoreIndex.IndexName,
        'should use the correct Index'
      )
      assert.include(
        ddbInput.KeyConditionExpression,
        'GameTitle =',
        'should query for the title'
      )
      assert.equal(
        ddbInput.ScanIndexForward,
        ascending,
        'should use the value of ascending for ScanIndexForward'
      )
      assert.equal(ddbInput.Limit, count, 'should set Limit to count')
    })

    it('wraps DynamoDB errors with DaoError', () => {
      sinon.stub(ddbDocClient, 'send').rejects('ERROR')

      return assert.isRejected(dao.getByGame('game', 10), DaoError)
    })
  })
})
