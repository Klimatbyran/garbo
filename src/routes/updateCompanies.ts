import express from 'express'
import { z } from 'zod'
import { validateRequest } from 'zod-express-middleware'

import { updateScope1, updateScope2, upsertCompany } from '../lib/prisma'
import {
  createMetadata,
  fakeAuth,
  reportingPeriod,
  ensureEmissionsExists,
} from './middlewares'
import { prisma } from '../lib/prisma'

const router = express.Router()
const tCO2e = 'tCO2e'
const unit = tCO2e

interface Metadata {
  source: any
  userId: any
}

router.use('/', fakeAuth())
router.use('/', express.json())

router.use(
  '/:wikidataId',
  validateRequest({
    params: z.object({
      wikidataId: z.string().regex(/Q\d+/),
    }),
  })
)

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/:wikidataId', createMetadata(prisma))

// TODO: Allow creating a company with more data included.
router.use(
  '/:wikidataId',
  validateRequest({
    body: z.object({ name: z.string(), description: z.string().optional() }),
  }),
  async (req, res) => {
    const { name, description } = req.body
    const { wikidataId } = req.params

    try {
      await upsertCompany({ wikidataId, name, description })
    } catch (error) {
      console.error('Failed to create company', error)
      return res.status(500).json({ error: 'Failed to create company' })
    }

    res.status(200).send()
  }
)

router.use('/:wikidataId/:year', reportingPeriod(prisma))

router.use('/:wikidataId/:year/emissions', ensureEmissionsExists(prisma))

// POST//Q12345/2022-2023/emissions
router.post(
  '/:wikidataId/:year/emissions',
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
      scope1 && (await updateScope1(emissions.scoep1Id, scope1, metadata))
      scope2 && (await updateScope2(emissions.scope2Id, scope2, metadata))
    } catch (error) {
      console.error('Failed to update emissions:', error)
      return res.status(500).json({ error: 'Failed to update emissions' })
    }

    res.status(200).send()
  }
)

export default router
