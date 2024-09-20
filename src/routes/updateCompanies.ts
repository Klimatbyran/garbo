import express, { Request, Response } from 'express'
import { z } from 'zod'
import { processRequestBody, validateRequest } from 'zod-express-middleware'

import { updateScope1, updateScope2, upsertCompany } from '../lib/prisma'
import {
  createMetadata,
  fakeAuth,
  reportingPeriod,
  ensureEmissionsExists,
  validateReportingPeriod,
  validateMetadata,
} from './middlewares'
import { prisma } from '../lib/prisma'
import { Company } from '@prisma/client'

const router = express.Router()
const tCO2e = 'tCO2e'
const unit = tCO2e

interface Metadata {
  source: any
  userId: any
}

const wikidataIdSchema = z.string().regex(/Q\d+/)

router.use('/', fakeAuth(prisma))
router.use('/', express.json())

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/', validateMetadata(), createMetadata(prisma))

// NOTE: The request body seems to be consumed the first time it we call the middleware processRequest()
// Thus, we can only call processRequest() and similar methods for actual API endpoints.
// Middlewares should only use validateRequest() and similar methods.
// NOTE: This might be worth looking into the `zod-express-middleware` package and see if we could improve this behaviour.
const validateCompanyUpsert = () =>
  processRequestBody(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      url: z.string().url().optional(),
      internalComment: z.string().optional(),
      wikidataId: wikidataIdSchema,
    })
  )

async function handleCompanyUpsert(req: Request, res: Response) {
  const { name, description, url, internalComment, wikidataId } = req.body

  let company: Company

  try {
    company = await upsertCompany({
      wikidataId,
      name,
      description,
      url,
      internalComment,
    })
  } catch (error) {
    console.error('Failed to upsert company', error)
    return res.status(500).json({ error: 'Failed to upsert company' })
  }

  return res.status(200).json(company)
}

// NOTE: Ideally we could have the same handler for both create and update operations, and provide the wikidataId as an URL param
// However, the middlewares didn't run in the expected order so the quick workaround was to just have two endpoints doing the same thing.
// Feel free to debug and improve!
router.post('/', validateCompanyUpsert(), handleCompanyUpsert)

// NOTE: Important to register this middleware after handling the POST requests for a specific wikidataId to still allow creating new companies.
router.use(
  '/:wikidataId',
  validateRequest({
    params: z.object({
      wikidataId: wikidataIdSchema,
    }),
  }),
  async (req, res, next) => {
    const { wikidataId } = req.params
    const company = await prisma.company.findFirst({ where: { wikidataId } })
    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }
    res.locals.company = company

    next()
  }
)

router.post('/:wikidataId', validateCompanyUpsert(), handleCompanyUpsert)

router.use(
  '/:wikidataId/:year',
  validateReportingPeriod(),
  reportingPeriod(prisma)
)

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
            message:
              'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
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
