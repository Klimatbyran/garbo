import express, { Request, Response } from 'express'
import { z } from 'zod'
import { validateRequest, validateRequestBody } from 'zod-express-middleware'

import {
  upsertBiogenic,
  upsertScope1,
  upsertScope2,
  upsertStatedTotalEmissions,
  upsertCompany,
  upsertScope3,
} from '../lib/prisma'
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
// IDEA: Allow metadata to be provided together with the request, to make it possible to add source, comment and similar
router.use('/', validateMetadata(), createMetadata(prisma))

const upsertCompanyBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  internalComment: z.string().optional(),
  wikidataId: wikidataIdSchema,
})

// NOTE: The request body seems to be consumed the first time it we call the middleware processRequest()
// Thus, we can only call processRequest() and similar methods for actual API endpoints.
// Middlewares should only use validateRequest() and similar methods.
// NOTE: This might be worth looking into the `zod-express-middleware` package and see if we could improve this behaviour.
const validateCompanyUpsert = () => validateRequestBody(upsertCompanyBodySchema)

async function handleCompanyUpsert(req: Request, res: Response) {
  const { data, error } = upsertCompanyBodySchema.safeParse(req.body)
  if (error) {
    return res.status(400).json({ error })
  }
  const { name, description, url, internalComment, wikidataId } = data

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

const statedTotalEmissionsSchema = z.object({ total: z.number() }).optional()

const postEmissionsBodySchema = z.object({
  emissions: z.object({
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
    scope3: z
      .object({
        scope3Categories: z
          .array(
            z.object({
              category: z.number().int().min(1).max(16),
              total: z.number(),
            })
          )
          .optional(),
        statedTotalEmissions: statedTotalEmissionsSchema,
      })
      .optional(),
    biogenic: z.object({ total: z.number() }).optional(),
    statedTotalEmissions: statedTotalEmissionsSchema,
    // scope1And2
  }),
})

// POST//Q12345/2022-2023/emissions
router.post(
  '/:wikidataId/:year/emissions',
  validateRequestBody(postEmissionsBodySchema),
  async (req, res) => {
    const { data, error } = postEmissionsBodySchema.safeParse(req.body)
    if (error) {
      return res.status(400).json({ error })
    }

    const { scope1, scope2, scope3, statedTotalEmissions, biogenic } =
      data.emissions
    const metadata = res.locals.metadata
    const emissions = res.locals.emissions

    try {
      // Only update if the input contains relevant changes
      // NOTE: The types for partial inputs like scope1 and scope2 say the objects always exist. However, this is not true.
      // There seems to be a type error in zod which doesn't take into account optional objects.

      await Promise.allSettled([
        scope1 && upsertScope1(emissions, scope1, metadata),
        scope2 && upsertScope2(emissions, scope2, metadata),
        // TODO: type error for scope 3 categories - similar to the zod type bug for scope 1 and 2, it's not handling optional types correctly.
        scope3 && upsertScope3(emissions, scope3 as unknown, metadata),
        statedTotalEmissions &&
          upsertStatedTotalEmissions(emissions, statedTotalEmissions, metadata),
        biogenic && upsertBiogenic(emissions, biogenic, metadata),
      ])
    } catch (error) {
      console.error('Failed to update emissions:', error)
      return res.status(500).json({ error: 'Failed to update emissions' })
    }

    res.status(200).send()
  }
)

export default router
