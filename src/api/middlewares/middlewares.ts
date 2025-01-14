import { NextFunction, Request, Response } from 'express'
import { Metadata, PrismaClient, User } from '@prisma/client'
import cors, { CorsOptionsDelegate } from 'cors'

import { GarboAPIError } from '../../lib/garbo-api-error'
import apiConfig from '../../config/api'
import { metadataRequestBody } from '../schemas'
import { validateRequestBody } from './zod-middleware'

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

export const fakeAuth =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '')

      if (!token || !apiConfig.tokens?.includes(token)) {
        throw GarboAPIError.unauthorized()
      }

      const [username] = token.split(':')
      const userEmail =
        username === 'garbo'
          ? apiConfig.authorizedUsers.garbo
          : apiConfig.authorizedUsers.alex

      if (!userEmail) {
        throw GarboAPIError.unauthorized()
      }

      const user = await prisma.user.findFirst({
        where: { email: userEmail },
      })

      if (!user?.id) {
        throw GarboAPIError.unauthorized()
      }

      res.locals.user = user
      next()
    } catch (error) {
      next(error)
    }
  }

export const validateMetadata = () => validateRequestBody(metadataRequestBody)

const editMethods = new Set(['POST', 'PATCH', 'PUT'])
export const createMetadata =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    let createdMetadata: Metadata | undefined = undefined
    // TODO: If we use a DB transaction (initiated before this middleware is called),
    // then we could always create metadata and just abort the transaction for invalid requests.
    // This would make it easy to work with, but still allow us to prevent adding metadata not connected to any actual changes.

    // We only need to create metadata when creating or updating data
    if (editMethods.has(req.method)) {
      // TODO: Find a better way to determine if changes by the current user should count as verified or not
      // IDEA: Maybe a column in the User table to determine if this is a trusted editor? And if so, all their changes are automatically "verified".
      const verifiedByUserEmail =
        res.locals.user.email === apiConfig.authorizedUsers.alex
          ? apiConfig.authorizedUsers.alex
          : null

      const { comment, source } = req.body.metadata ?? {}

      createdMetadata = await prisma.metadata.create({
        data: {
          comment,
          source,
          user: {
            connect: {
              id: res.locals.user.id,
            },
          },
          verifiedBy: verifiedByUserEmail
            ? {
                connect: {
                  email: verifiedByUserEmail,
                },
              }
            : undefined,
        },
      })
    }

    res.locals.metadata = createdMetadata
    next()
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
