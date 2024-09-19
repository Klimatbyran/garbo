import { NextFunction, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { processRequest, validateRequest } from 'zod-express-middleware'
import { z } from 'zod'

export const cache = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'public, max-age=3000')
    next()
  }
}

export const fakeAuth =
  () => (req: Request, res: Response, next: NextFunction) => {
    res.locals.user = {
      id: 2,
      name: 'Alexandra Palmqvist',
      email: 'alex@klimatkollen.se',
    }
    next()
  }

export const createMetadata =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Find a better way to determine if changes by the current user should count as verified or not
    const verifiedByUserId = res.locals.user.id === 2 ? 2 : null
    const metadata = {
      source: req.body.url,
      userId: res.locals.user.id,
      verifiedByUserId,
    }
    res.locals.metadata = metadata
    next()
  }

export const validateReportingPeriod = () =>
  processRequest({
    params: z.object({
      year: z.string().regex(/\d{4}(?:-\d{4})?/),
    }),
    body: z
      .object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reportURL: z.string().optional(),
      })
      .refine(
        ({ startDate, endDate }) => startDate.getTime() < endDate.getTime(),
        { message: 'startDate must be earlier than endDate' }
      ),
  })

export const reportingPeriod =
  (prisma: PrismaClient) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const { wikidataId, year } = req.params
    const { startDate, endDate, reportURL } = req.body

    const company = await prisma.company.findFirst({ where: { wikidataId } })
    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }
    res.locals.company = company

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

    const reportingPeriod =
      (await prisma.reportingPeriod.findFirst({
        where: {
          companyId: wikidataId,
          // TODO: find the reporting period with the same endYear
          endDate: {},
        },
      })) ||
      (await prisma.reportingPeriod.create({
        data: {
          startDate,
          endDate,
          reportURL,
          company: {
            connect: {
              wikidataId,
            },
          },
          metadata: {
            create: metadata,
          },
        },
      }))
    res.locals.reportingPeriod = reportingPeriod

    next()
  }

export const ensureEmissionsExists =
  (prisma) => async (req: Request, res: Response, next: NextFunction) => {
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
