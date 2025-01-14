import { NextFunction, Request, Response } from 'express'
import { Metadata, User } from '@prisma/client'
import cors, { CorsOptionsDelegate } from 'cors'

import apiConfig from '../../config/api'

declare global {
  namespace Express {
    interface Locals {
      user: User
      metadata?: Metadata
    }
  }
}

export const cache = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${apiConfig.cacheMaxAge}`)
    next()
  }
}

const getCorsOptionsBasedOnOrigin =
  (allowedOrigins: string[]): CorsOptionsDelegate =>
  (req: Request, callback) => {
    const origin = req.header('Origin')
    const corsOptions =
      origin && allowedOrigins.includes(origin)
        ? { origin: true }
        : { origin: false }
    callback(null, corsOptions)
  }

export const enableCors = (allowedOrigins: string[]) =>
  cors(getCorsOptionsBasedOnOrigin(allowedOrigins))
