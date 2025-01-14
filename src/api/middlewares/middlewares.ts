import { NextFunction, Request, Response } from 'express'
import { Metadata, User } from '@prisma/client'

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
