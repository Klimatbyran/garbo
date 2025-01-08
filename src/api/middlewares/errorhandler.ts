import { NextFunction, Response, Request } from 'express'
import { GarboAPIError } from '../../lib/garbo-api-error'

export function handleError(
  err: GarboAPIError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(err.statusCode || 500).json({
    error: err.message,
    details: err.original || null,
  })
}
