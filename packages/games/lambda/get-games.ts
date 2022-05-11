import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDbGameDao } from '../lib/data/dynamodb.js'
import { GameService } from '../lib/service.js'
import { isSuccess } from 'shared'

const gameService = createGameService()

const QUERY_TITLE = 'title'

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const title = event.queryStringParameters?.[QUERY_TITLE]
  if (title == null) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Query parameter 'title' is required" }),
    }
  }

  try {
    const result = await gameService.getGameByTitle(title)
    if (isSuccess(result)) {
      return {
        statusCode: result.status,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      }
    } else {
      return {
        statusCode: result.status,
        body: result.message,
      }
    }
  } catch (error) {
    console.error('Error getting game:', error)
    return {
      statusCode: 500,
      body: 'Internal server error',
    }
  }
}

function createGameService(): GameService {
  const ddbClient = new DynamoDBClient({})
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
  const gameDao = new DynamoDbGameDao(ddbDocClient)
  return new GameService(gameDao)
}
