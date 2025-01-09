import { ZodError } from 'zod'
import { NextFunction, Response, Request } from 'express'

import { GarboAPIError } from '../../lib/garbo-api-error'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.log.error(error)

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    res.status(422).json({
      error: 'Validation failed',
      details: formattedErrors,
      help: 'Kontrollera att alla fält har korrekta värden enligt API-specifikationen',
    })
    return
  } else if (error instanceof GarboAPIError) {
    req.log.error(error.original)
    res.status(error.statusCode).json({
      error: error.message,
      details: error.original,
      help: 'Kontakta support om felet kvarstår',
    })
    return
  }

  res.status(500).json({
    error: 'Internal Server Error',
    help: 'Ett oväntat fel uppstod. Kontakta support om problemet kvarstår.',
  })
}
