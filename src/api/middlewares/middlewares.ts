import { NextFunction, Request, Response } from 'express'
import { Company, Metadata, PrismaClient, User } from '@prisma/client'
import {
  processRequestBody,
  validateRequest,
  validateRequestBody,
} from './zod-middleware'
import { z, ZodError } from 'zod'
import cors, { CorsOptionsDelegate } from 'cors'
import { GarboAPIError } from '../../lib/garbo-api-error'
import apiConfig from '../../config/api'
import {
  DefaultEconomyArgs,
  DefaultEmissions,
  DefaultReportingPeriod,
} from '../types'
import { reportingPeriodService } from '../services/reportingPeriodService'
import { emissionsService } from '../services/emissionsService'
import { companyService } from '../services/companyService'
import {
  metadataRequestBody,
  reportingPeriodBodySchema,
  upsertCompanyBodySchema,
} from '../schemas'

declare global {
  namespace Express {
    interface Locals {
      user: User
      company: Company
      reportingPeriod: DefaultReportingPeriod
      metadata?: Metadata
      emissions?: DefaultEmissions
      economy?: DefaultEconomyArgs
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
        res.locals.user.email === USERS.alex ? USERS.alex : null

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

export const validateReportingPeriodRequest = () =>
  validateRequest({
    params: z.object({
      /**
       * This allows reporting periods like 2022-2023
       */
      year: z.string().regex(/\d{4}(?:-\d{4})?/),
    }),
    body: reportingPeriodBodySchema,
  })

export const ensureReportingPeriod =
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
      const reportingPeriod =
        await reportingPeriodService.upsertReportingPeriod(company, metadata, {
          startDate,
          endDate,
          reportURL,
          year,
        })

      res.locals.reportingPeriod = reportingPeriod
    }

    next()
  }

export const validateCompanyRequest = () =>
  processRequestBody(upsertCompanyBodySchema)

export async function ensureCompany(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { name, description, url, internalComment, wikidataId, tags } =
    upsertCompanyBodySchema.parse(req.body)

  const company = await companyService.upsertCompany({
    wikidataId,
    name,
    description,
    url,
    internalComment,
    tags,
  })
  res.locals.company = company

  next()
}

export const fetchCompanyByWikidataId =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const { wikidataId } = req.params
    const company = await prisma.company.findFirst({ where: { wikidataId } })
    if (!company) {
      throw new GarboAPIError('Company not found', { statusCode: 404 })
    }
    res.locals.company = company

    next()
  }

export const ensureEmissionsExists =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const reportingPeriod = res.locals.reportingPeriod

    const emissions = await emissionsService.upsertEmissions({
      emissionsId: reportingPeriod.emissions?.id ?? 0,
      reportingPeriodId: reportingPeriod.id,
    })

    res.locals.emissions = emissions
    next()
  }

export const ensureEconomyExists =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const reportingPeriod = res.locals.reportingPeriod

    const economy = await companyService.upsertEconomy({
      economyId: reportingPeriod.economy?.id ?? 0,
      reportingPeriodId: reportingPeriod.id,
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

export const errorHandler = (error: Error, req: Request, res: Response) => {
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
