import { NextFunction, Request, Response } from 'express'
import {
  Company,
  Economy,
  Emissions,
  Metadata,
  PrismaClient,
  ReportingPeriod,
  User,
} from '@prisma/client'
import { validateRequest, validateRequestBody } from './zod-middleware'
import { z, ZodError } from 'zod'
import cors, { CorsOptionsDelegate } from 'cors'

import { ensureReportingPeriodExists } from '../lib/prisma'
import { GarboAPIError } from '../lib/garbo-api-error'
import apiConfig from '../config/api'

declare global {
  namespace Express {
    interface Locals {
      user: User
      company: Company
      reportingPeriod: ReportingPeriod
      metadata?: Metadata
      emissions?: Emissions
      economy?: Economy
    }
  }
}

export const cache = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'public, max-age=3000')
    next()
  }
}

const USERS = {
  garbo: 'hej@klimatkollen.se',
  alex: 'alex@klimatkollen.se',
}

export const fakeAuth =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (token) {
      if (apiConfig.tokens.includes(token)) {
        const [username] = token.split(':')
        const user = await prisma.user.findFirst({
          where: { email: USERS[username] },
        })
        if (user) {
          res.locals.user = user
        }
      }
    }

    if (!res.locals.user?.id) {
      throw GarboAPIError.unauthorized()
    }

    next()
  }

export const validateMetadata = () =>
  validateRequestBody(
    z.object({
      metadata: z
        .object({
          comment: z.string().optional(),
          source: z.string().optional(),
          dataOrigin: z.string().optional(),
        })
        .optional(),
    })
  )

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
        res.locals.user.email === USERS.alex ? USERS.alex : null

      const { comment, source, dataOrigin } = req.body.metadata ?? {}

      createdMetadata = await prisma.metadata.create({
        data: {
          comment,
          source,
          dataOrigin,
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

const reportingPeriodBodySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reportURL: z.string().optional(),
  })
  .refine(({ startDate, endDate }) => startDate.getTime() < endDate.getTime(), {
    message: 'startDate must be earlier than endDate',
  })

export const validateReportingPeriod = () =>
  validateRequest({
    params: z.object({
      year: z.string().regex(/\d{4}(?:-\d{4})?/),
    }),
    body: reportingPeriodBodySchema,
  })

export const reportingPeriod =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const { year } = req.params

    // NOTE: Since we have to use validateRequest() for middlewares,
    // we have to parse the request body twice.
    // We should find a cleaner and more declarative pattern for this.
    // Look if we can solve this in a good way for express. Otherwise see how fastify handles schema validation.
    const { startDate, endDate, reportURL } = reportingPeriodBodySchema.parse(
      req.body
    )

    const endYear = parseInt(year.split('-').at(-1)!)
    if (endYear !== endDate.getFullYear()) {
      throw new GarboAPIError(
        `The URL param year must be the same year as the endDate (${endYear})`
      )
    }

    const metadata = res.locals.metadata!
    const company = res.locals.company

    if (req.method === 'POST' || req.method === 'PATCH') {
      // TODO: Only allow creating a reporting period when updating other data
      // TODO: Maybe throw 404 if the reporting period was not found and it is a GET request
      const reportingPeriod = await ensureReportingPeriodExists(
        company,
        metadata,
        { startDate, endDate, reportURL, year }
      )

      res.locals.reportingPeriod = reportingPeriod
    }

    next()
  }

export const ensureEmissionsExists =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const reportingPeriod = res.locals.reportingPeriod
    const emissionsId = res.locals.reportingPeriod.emissionsId ?? 0

    const emissions = await prisma.emissions.upsert({
      where: { id: emissionsId ?? 0 },
      update: {},
      create: {
        reportingPeriod: {
          connect: {
            reportingPeriodId: {
              year: reportingPeriod.year,
              companyId: reportingPeriod.companyId,
            },
          },
        },
      },
    })

    res.locals.emissions = emissions
    next()
  }

export const ensureEconomyExists =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const reportingPeriod = res.locals.reportingPeriod
    const economyId = res.locals.reportingPeriod.economyId ?? 0

    const economy = await prisma.economy.upsert({
      where: { id: economyId },
      update: {},
      create: {
        reportingPeriod: {
          connect: {
            reportingPeriodId: {
              year: reportingPeriod.year,
              companyId: reportingPeriod.companyId,
            },
          },
        },
      },
    })

    res.locals.economy = economy
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

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.log.error(error)

  if (error instanceof ZodError) {
    // TODO: try to remove the extra JSON.parse here
    res.status(422).json({ error: JSON.parse(error.message) })
    return
  } else if (error instanceof GarboAPIError) {
    req.log.error(error.original)
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  res.status(500).json({ error: 'Internal Server Error' })
}
