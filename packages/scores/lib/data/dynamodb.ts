import {
  AttributeDefinition,
  CreateTableCommand,
  CreateTableCommandInput,
  DynamoDBClient,
  GlobalSecondaryIndex,
  KeySchemaElement,
  Projection,
  QueryCommand,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { nanoid } from 'nanoid'
import { GameScore } from '../model.js'
import { DaoError, GameScoreDao } from './dao.js'

export const TABLE_NAME = 'GameScores'

export type TableAttributeName =
  | 'Id'
  | 'GameTitle'
  | 'PlayerId'
  | 'PlayerUsername'
  | 'Score'
  | 'CreatedDateTime'

/**
 * The item attributes that the table will use. The value of each key is its
 * type.
 */
export const Attributes: Readonly<{
  [key in TableAttributeName]: Omit<AttributeDefinition, 'AttributeName'> & {
    AttributeName: TableAttributeName
  }
}> = {
  Id: {
    AttributeName: 'Id',
    AttributeType: 'S',
  },
  GameTitle: {
    AttributeName: 'GameTitle',
    AttributeType: 'S',
  },
  PlayerId: {
    AttributeName: 'PlayerId',
    AttributeType: 'S',
  },
  PlayerUsername: {
    AttributeName: 'PlayerUsername',
    AttributeType: 'S',
  },
  Score: {
    AttributeName: 'Score',
    AttributeType: 'N',
  },
  CreatedDateTime: {
    AttributeName: 'CreatedDateTime',
    AttributeType: 'S',
  },
}

export const PrimaryKeyAttributes: Array<
  Omit<KeySchemaElement, 'AttributeName'> & {
    AttributeName: TableAttributeName
  }
> = [
  {
    AttributeName: 'Id',
    KeyType: 'HASH',
  },
  {
    AttributeName: 'GameTitle',
    KeyType: 'RANGE',
  },
]

export type IndexNames = 'PlayerId' | 'GameTitleScore'

/**
 * The Global Secondary Indices that the table will use.
 */
export const GlobalIndices: Readonly<
  Record<
    IndexNames,
    Omit<GlobalSecondaryIndex, 'IndexName' | 'KeySchema' | 'Projection'> & {
      IndexName: IndexNames
      KeySchema: Array<
        Omit<KeySchemaElement, 'AttributeName'> & {
          AttributeName: TableAttributeName
        }
      >
      Projection: Omit<Projection, 'NonKeyAttributes'> & {
        NonKeyAttributes?: TableAttributeName[]
      }
    }
  >
> = {
  PlayerId: {
    IndexName: 'PlayerId',
    KeySchema: [
      {
        AttributeName: 'PlayerId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'Score',
        KeyType: 'RANGE',
      },
    ],
    Projection: {
      ProjectionType: 'ALL',
    },
  },
  GameTitleScore: {
    IndexName: 'GameTitleScore',
    KeySchema: [
      {
        AttributeName: 'GameTitle',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'Score',
        KeyType: 'RANGE',
      },
    ],
    Projection: {
      ProjectionType: 'ALL',
    },
  },
}

/**
 * Initializes the app's Table using the given `DynamoDBClient`.
 *
 * @throws `Error` if an exception other than "Table Exists" was thrown
 * when trying to initialize.
 */
export async function initTable(ddbClient: DynamoDBClient) {
  const params: CreateTableCommandInput = {
    AttributeDefinitions: Object.values(Attributes),
    KeySchema: Object.values(PrimaryKeyAttributes),
    GlobalSecondaryIndexes: Object.values(GlobalIndices),
    BillingMode: 'PAY_PER_REQUEST',
    TableName: TABLE_NAME,
    StreamSpecification: {
      StreamEnabled: false,
    },
  }
  try {
    const data = await ddbClient.send(new CreateTableCommand(params))
    console.log('Table Created', data)
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log('Table already exists')
    } else {
      throw new Error(`Unknown error ${err}`)
    }
  }
}

/**
 * A {@link GameScoresDao} that uses DynamoDB for persistence.
 */
export class DynamoDbGameScoreDao implements GameScoreDao {
  constructor(private ddbDocClient: DynamoDBDocumentClient) {}

  async save(
    score: Omit<GameScore, 'Id' | 'CreatedDateTime'>
  ): Promise<GameScore> {
    const id = nanoid()
    const params: Omit<PutCommandInput, 'Item'> & {
      Item: GameScore
    } = {
      TableName: TABLE_NAME,
      Item: {
        Id: id,
        GameTitle: score.GameTitle,
        PlayerId: score.PlayerId,
        PlayerUsername: score.PlayerUsername,
        Score: score.Score,
        CreatedDateTime: new Date(),
      },
    }

    try {
      await this.ddbDocClient.send(new PutCommand(params))
    } catch (error) {
      throw new DaoError('error in put:', error)
    }

    return {
      ...params.Item,
    }
  }

  async getByGame(
    gameTitle: string,
    count: number,
    ascending: boolean = false
  ): Promise<GameScore[]> {
    const params: QueryCommandInput = {
      TableName: TABLE_NAME,
      IndexName: GlobalIndices.GameTitleScore.IndexName,
      KeyConditionExpression: 'GameTitle = :title',
      ExpressionAttributeValues: {
        ':title': { S: gameTitle },
      },
      Limit: count,
      ScanIndexForward: ascending,
    }

    try {
      const queryResult = await this.ddbDocClient.send(new QueryCommand(params))
      // TODO expose paging to clients
      return queryResult.Items as unknown as GameScore[]
    } catch (error) {
      throw new DaoError('error in query:', error)
    }
  }
}
