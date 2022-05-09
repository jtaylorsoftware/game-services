/**
 * Models an error in a field of a request body.
 */
export type FieldError = {
  field?: string
  message: string
  value?: any
}

/**
 * Models an invalid request response.
 */
export type Failure = {
  status: number
  message: string
  errors?: FieldError[]
}

/**
 * Models a successful request.
 */
export type Success<T> = {
  status: number
  data: T
}

/**
 * Models the result of a handler.
 */
export type Result<T> = Success<T> | Failure

/**
 * Type predicate that checks if a {@link Result} is {@link Success} or not.
 */
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.status >= 200 && result.status < 300
}
