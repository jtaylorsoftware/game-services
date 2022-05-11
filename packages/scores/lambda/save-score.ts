import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  SecretsManagerClient,
  GetSecretValueCommandInput,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { ManagementClient } from 'auth0'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import axios from 'axios'
import { FieldError, isSuccess, Result } from 'shared'
import { DynamoDbGameScoreDao } from '../lib/data/dynamodb.js'
import { GameScoreSubmission } from '../lib/model.js'
import {
  Auth0UserService,
  GameQueryService,
  GameScoreService,
  UserQueryService,
} from '../lib/service.js'

const service = await createGameScoreService()

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (
    event.requestContext.authorizer == null ||
    event.requestContext.authorizer?.claims?.sub == null
  ) {
    return {
      statusCode: 401,
      body: 'Unauthorized',
    }
  }

  if (
    event.body == null ||
    event.headers['Content-Type'] !== 'application/json'
  ) {
    return {
      statusCode: 400,
      body: 'Bad request',
    }
  }

  let body: any
  try {
    body = JSON.parse(event.body)
  } catch (error) {
    return {
      statusCode: 400,
      body: 'Bad request',
    }
  }
  if (typeof body !== 'object') {
    return {
      statusCode: 400,
      body: 'Bad request',
    }
  }

  const validationResult = validateBody(body)
  if (!isSuccess(validationResult)) {
    return {
      statusCode: validationResult.status,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Invalid request',
        errors: validationResult.errors,
      }),
    }
  }

  const user = event.requestContext.authorizer.claims.sub as string
  const gameScoreSubmission = validationResult.data
  gameScoreSubmission.PlayerId = user

  try {
    const result = await service.submitScore(gameScoreSubmission)
    if (isSuccess(result)) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      }
    } else {
      return {
        statusCode: result.status,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: result.message }),
      }
    }
  } catch (error) {
    console.error('could not save score: ', error)
    return {
      statusCode: 500,
      body: 'Internal server error',
    }
  }
}

function validateBody(body: any): Result<GameScoreSubmission> {
  if (typeof body !== 'object') {
    return {
      status: 400,
      message: 'Invalid request data',
    }
  }

  const errors: FieldError[] = []

  if (typeof body.GameTitle !== 'string') {
    errors.push({
      field: 'GameTitle',
      message: 'GameTitle is required.',
    })
  }
  if (typeof body.Score !== 'number') {
    errors.push({
      field: 'Score',
      message: 'Score is required.',
    })
  }

  return {
    status: 200,
    data: body,
  }
}

async function createUserQueryService(): Promise<UserQueryService> {
  // Get the auth0 secret credentials
  const secretsClient = new SecretsManagerClient({ region: 'us-west-2' })
  const params: GetSecretValueCommandInput = {
    SecretId: 'Auth0_Client_Secrets',
  }
  const response = await secretsClient.send(new GetSecretValueCommand(params))
  const secrets = JSON.parse(response.SecretString ?? '{}')

  const auth0ManagementClient = new ManagementClient({
    domain: secrets.domain,
    clientId: secrets.clientId,
    clientSecret: secrets.clientSecret,
    scope: 'read:users',
  })

  return new Auth0UserService(auth0ManagementClient)
}

async function createGameScoreService(): Promise<GameScoreService> {
  const ddbClient = new DynamoDBClient({})
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
  const gameScoreDao = new DynamoDbGameScoreDao(ddbDocClient)

  const axiosInstance = axios.create({ baseURL: process.env.GAME_SERVICE_URL })
  const gameQueryService = new GameQueryService(axiosInstance)

  const userService = await createUserQueryService()

  return new GameScoreService(gameScoreDao, userService, gameQueryService)
}
