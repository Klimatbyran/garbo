import express, { NextFunction, Request, Response } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'
import { getGics } from '../lib/gics'
import { z } from 'zod'
import { processRequest, validateRequest } from 'zod-express-middleware'
import type { Emissions, Scope1, Scope2 } from '../types/Company'
import { assert } from 'console'
import {
  cache,
  createMetadata,
  fakeAuth,
  reportingPeriod,
  ensureEmissionsExists,
} from './middlewares'

const prisma = new PrismaClient()

const router = express.Router()
const tCO2e = 'tCO2e'
const unit = tCO2e

interface Metadata {
  source: any
  userId: any
}

async function updateScope1(
  emissions: Emissions,
  scope1: Scope1,
  metadata: Metadata
) {
  return emissions.scope1Id
    ? await prisma.scope1.update({
        where: {
          id: emissions.scope1Id,
        },
        data: {
          ...scope1,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
    : await prisma.scope1.create({
        data: {
          ...scope1,
          unit: tCO2e,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
}

async function updateScope2(
  emissions: Emissions,
  scope2: Scope2,
  metadata: Metadata
) {
  return emissions.scope2Id
    ? await prisma.scope2.update({
        where: {
          id: emissions.scope2Id,
        },
        data: {
          ...scope2,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
    : await prisma.scope2.create({
        data: {
          ...scope2,
          unit: tCO2e,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
}

router.use('/companies', fakeAuth())
router.use('/companies', express.json())

router.use(
  '/companies/:wikidataId',
  validateRequest({
    params: z.object({
      wikidataId: z.string().regex(/Q\d+/),
    }),
  })
)

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/companies/:wikidataId', createMetadata(prisma))

// TODO: Allow creating a company with more data included.
router.post(
  '/companies/:wikidataId',
  validateRequest({
    body: z.object({ name: z.string(), description: z.string().optional() }),
  }),
  async (req, res) => {
    const { name, description } = req.body
    const { wikidataId } = req.params

    try {
      await prisma.company.upsert({
        where: {
          wikidataId,
        },
        create: {
          name,
          description,
          wikidataId,
        },
        update: { name, description },
      })
    } catch (error) {
      console.error('Failed to create company', error)
      return res.status(500).json({ error: 'Failed to create company' })
    }

    res.status(200).send()
  }
)

router.use(
  '/companies/:wikidataId/:year',

  reportingPeriod(prisma)
)

router.use(
  '/companies/:wikidataId/:year/emissions',
  ensureEmissionsExists(prisma)
)

// POST/companies/Q12345/2022-2023/emissions
router.post(
  '/companies/:wikidataId/:year/emissions',
  validateRequest({
    body: z.object({
      scope1: z
        .object({
          total: z.number(),
        })
        .optional(),
      scope2: z
        .object({
          mb: z.number().optional(),
          lb: z.number().optional(),
          unknown: z.number().optional(),
        })
        .refine(
          ({ mb, lb, unknown }) =>
            mb !== undefined || lb !== undefined || unknown !== undefined,
          {
            message: 'One of the fields must be defined if scope2 is provided',
          }
        )
        .optional(),
      // statedTotalEmissions
      // biogenic
      // scope3 with all sub properties
    }),
  }),
  async (req, res) => {
    const { scope1, scope2 } = req.body
    const metadata = res.locals.metadata
    const emissions = res.locals.emissions

    try {
      scope1 && (await updateScope1(emissions, scope1, metadata))
      scope2 && (await updateScope2(emissions, scope2, metadata))
    } catch (error) {
      console.error('Failed to update emissions:', error)
      return res.status(500).json({ error: 'Failed to update emissions' })
    }

    res.status(200).send()
  }
)

export default router
