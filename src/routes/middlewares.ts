import { NextFunction, Request, Response } from 'express'
import {
  Company,
  Metadata,
  PrismaClient,
  ReportingPeriod,
  User,
} from '@prisma/client'
import { validateRequest, validateRequestBody } from 'zod-express-middleware'
import { z } from 'zod'
import { ensureReportingPeriodExists } from '../lib/prisma'

declare global {
  namespace Express {
    interface Locals {
      user: User
      company: Company
      reportingPeriod: ReportingPeriod
      metadata?: Metadata
    }
  }
}

export const cache = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'public, max-age=3000')
    next()
  }
}

const ALEX_ID = 2

export const fakeAuth =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findFirst({ where: { id: ALEX_ID } })
    res.locals.user = user
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
      const verifiedByUserId = res.locals.user.id === ALEX_ID ? ALEX_ID : null

      if (!res.locals.user?.id) {
        return res.status(401)
      }

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
          verifiedBy: verifiedByUserId
            ? {
                connect: {
                  id: verifiedByUserId,
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
          select: { id: true, scope1Id: true, scope2Id: true },
        })
      : await prisma.emissions.create({
          data: {
            reportingPeriods: {
              connect: {
                id: reportingPeriod.id,
              },
            },
          },
          select: { id: true, scope1Id: true, scope2Id: true },
        })

    res.locals.emissions = emissions

    next()
  }
