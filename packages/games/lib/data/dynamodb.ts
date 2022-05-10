import {
  AttributeDefinition,
  CreateTableCommand,
  CreateTableCommandInput,
  DynamoDBClient,
  KeySchemaElement,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { Game } from 'shared'
import { DaoError, GameDao } from './dao.js'

export const TABLE_NAME = 'Games'

export type TableAttributeName = keyof Game

/**
 * The item attributes that the table will use. The value of each key is its
 * type.
 */
export const Attributes: Readonly<{
  [key in TableAttributeName]: Omit<AttributeDefinition, 'AttributeName'> & {
    AttributeName: TableAttributeName
  }
}> = {
  Title: {
    AttributeName: 'Title',
    AttributeType: 'S',
  },
  AddedDateTime: {
    AttributeName: 'AddedDateTime',
    AttributeType: 'S',
  },
  TimesPlayed: {
    AttributeName: 'TimesPlayed',
    AttributeType: 'N',
  },
}

export const PrimaryKeyAttributes: Array<
  Omit<KeySchemaElement, 'AttributeName'> & {
    AttributeName: TableAttributeName
  }
> = [
  {
    AttributeName: 'Title',
    KeyType: 'HASH',
  },
  {
    AttributeName: 'AddedDateTime',
    KeyType: 'RANGE',
  },
]

/**
 * Initializes the app's Table using the given `DynamoDBClient`.
 *
 * @throws `Error` if an exception other than "Table Exists" was thrown
 * when trying to initialize.
 */
export async function initTable(ddbClient: DynamoDBClient): Promise<void> {
  const params: CreateTableCommandInput = {
    AttributeDefinitions: Object.values(Attributes),
    KeySchema: Object.values(PrimaryKeyAttributes),
    BillingMode: 'PAY_PER_REQUEST',
    TableName: TABLE_NAME,
  }

  try {
    const data = await ddbClient.send(new CreateTableCommand(params))
    console.log(`Table ${TABLE_NAME} Created`, data)
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log('Table already exists')
    } else {
      throw new Error(`Unknown error ${err}`)
    }
  }
}

/**
 * A {@link GameDao} that uses DynamoDB for persistence.
 */
export class DynamoDbGameDao implements GameDao {
  constructor(private ddbDocClient: DynamoDBDocumentClient) {}

  async findByTitle(title: string): Promise<Game | null> {
    try {
      const params: QueryCommandInput = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'Title = :title',
        ExpressionAttributeValues: {
          // prettier-ignore
          ':title': title,
        },
      }
      const queryResult = await this.ddbDocClient.send(new QueryCommand(params))
      return queryResult.Count === 0
        ? null
        : (queryResult.Items?.[0] as unknown as Game)
    } catch (error) {
      throw new DaoError('error in query', error)
    }
  }
}
