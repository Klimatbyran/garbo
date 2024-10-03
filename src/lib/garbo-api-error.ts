export class GarboAPIError extends Error {
  statusCode: number
  originalError?: Error

  constructor(
    message: string,
    originalError?: Error,
    statusCode: number = 400
  ) {
    super(message)
    this.originalError = originalError
    this.statusCode = statusCode
  }
}
