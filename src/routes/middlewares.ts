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
import { validateRequest, validateRequestBody } from 'zod-express-middleware'
import { z, ZodError } from 'zod'
import cors, { CorsOptionsDelegate } from 'cors'

import { ensureReportingPeriodExists } from '../lib/prisma'
import { GarboAPIError } from '../lib/garbo-api-error'

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

const envSchema = z.object({
  /**
   * Comma-separated list of API tokens. E.g. garbo:lk3h2k1,alex:ax32bg4
   * NOTE: This is only relevant during import with alex data, and then we switch to proper auth tokens.
   */
  API_TOKENS: z.string().transform((tokens) => tokens.split(',')),
})

const ENV = envSchema.parse(process.env)

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
      if (ENV.API_TOKENS.includes(token)) {
        const [username] = token.split(':')
        const user = await prisma.user.findFirst({
          where: { email: USERS[username] },
        })
        res.locals.user = user
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

export const createMetadata =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    let createdMetadata = undefined
    // TODO: If we use a DB transaction (initiated before this middleware is called),
    // then we could always create metadata and just abort the transaction for invalid requests.
    // This would make it easy to work with, but still allow us to prevent adding metadata not connected to any actual changes.

    // We only need to create metadata when creating or updating data
    if (req.method === 'POST') {
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
    // NOTE: Maybe we could setup proper error handling, and just use the regular zodSchema.parse(req.body) which throws `ZodError`s?
    // This would allow us to simplify the code and replace all res.status(400).json({ error }) in every middleware/endpoint with a shared error hanlder instead.
    const { data, error } = reportingPeriodBodySchema.safeParse(req.body)
    if (error) {
      return res.status(400).json({ error })
    }
    const { startDate, endDate, reportURL } = data

    const endYear = parseInt(year.split('-').at(-1))
    if (endYear !== endDate.getFullYear()) {
      return res.status(400).json({
        error:
          'The URL param year must be the same year as the endDate (' +
          endYear +
          ') ',
      })
    }

    const metadata = res.locals.metadata
    const company = res.locals.company

    const reportingPeriod = await ensureReportingPeriodExists(
      company,
      metadata,
      { startDate, endDate, reportURL }
    )

    res.locals.reportingPeriod = reportingPeriod
    next()
  }

export const ensureEmissionsExists =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const reportingPeriod = res.locals.reportingPeriod
    const emissionsId = res.locals.reportingPeriod.emissionsId

    const emissions = emissionsId
      ? await prisma.emissions.findFirst({
          where: { id: emissionsId },
        })
      : await prisma.emissions.create({
          data: {
            reportingPeriod: {
              connect: {
                id: reportingPeriod.id,
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
    const economyId = res.locals.reportingPeriod.economyId

    const economy = economyId
      ? await prisma.economy.findFirst({
          where: { id: economyId },
        })
      : await prisma.economy.create({
          data: {
            reportingPeriod: {
              connect: {
                id: reportingPeriod.id,
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
    const corsOptions = allowedOrigins.includes(req.header('Origin'))
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
  console.error(error)

  if (error instanceof ZodError) {
    res.status(400).json({ error: error.message })
    return
  } else if (error instanceof GarboAPIError) {
    console.error(error.originalError)
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  res.status(500).json({ error: 'Internal server error' })
}
