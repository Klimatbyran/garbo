export class GarboAPIError extends Error {
  statusCode: number
  original?: Error

  constructor(
    message: string,
    options: {
      statusCode?: number
      original?: Error
    } = {}
  ) {
    super(message)

    const { statusCode = 400, original } = options

    this.statusCode = statusCode
    this.original = original
  }

  static unauthorized() {
    return new GarboAPIError('Unauthorized', { statusCode: 401 })
  }
}
