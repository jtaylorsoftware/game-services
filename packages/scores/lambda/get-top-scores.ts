import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { isSuccess } from 'shared'
import { DynamoDbGameScoreDao } from '../lib/data/dynamodb.js'
import { GameScoreQueryService } from '../lib/service.js'

const service = createGameScoreQueryService()

const QUERY_COUNT = 'count'
const QUERY_GAME = 'game'

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const gameTitle = event.queryStringParameters?.[QUERY_GAME]
  if (gameTitle == null) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Query parameter 'game' is required" }),
    }
  }
  console.log('Requested scores for Game:', gameTitle)

  let countParam = event.queryStringParameters?.[QUERY_COUNT]
  let count: number
  if (countParam == null) {
    count = 10
  } else {
    const parsedCount = parseInt(countParam)
    if (isNaN(parsedCount) || parsedCount <= 0)
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Query parameter 'count' must be a positive number",
        }),
      }
    count = parsedCount
  }

  try {
    const result = await service.getTopScoresForGame(gameTitle, count)
    if (isSuccess(result)) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: result.data,
        }),
      }
    } else {
      return {
        statusCode: result.status,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: result.message,
        }),
      }
    }
  } catch (error) {
    console.error('Error getting game:', error)
    return {
      statusCode: 500,
    }
  }
}

function createGameScoreQueryService(): GameScoreQueryService {
  const ddbClient = new DynamoDBClient({})
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
  const gameScoreDao = new DynamoDbGameScoreDao(ddbDocClient)

  return new GameScoreQueryService(gameScoreDao)
}
