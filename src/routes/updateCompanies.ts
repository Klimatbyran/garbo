import express, { Request, Response } from 'express'
import { z } from 'zod'
import { processRequest, processRequestBody } from './zod-middleware'

import {
  upsertBiogenic,
  upsertScope1,
  upsertScope2,
  upsertStatedTotalEmissions,
  upsertCompany,
  upsertScope3,
  upsertTurnover,
  upsertEmployees,
  upsertIndustry,
  createGoals,
  updateGoal,
  createInitiatives,
  updateInitiative,
} from '../lib/prisma'
import {
  createMetadata,
  fakeAuth,
  reportingPeriod,
  ensureEmissionsExists,
  validateReportingPeriod,
  validateMetadata,
  ensureEconomyExists,
} from './middlewares'
import { prisma } from '../lib/prisma'
import { Company, Prisma } from '@prisma/client'
import { wikidataIdParamSchema, wikidataIdSchema } from './companySchemas'
import { GarboAPIError } from '../lib/garbo-api-error'

const router = express.Router()
const tCO2e = 'tCO2e'
const unit = tCO2e

router.use('/', fakeAuth(prisma))
router.use('/', express.json())

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/', validateMetadata(), createMetadata(prisma))

const upsertCompanyBodySchema = z.object({
  wikidataId: wikidataIdSchema,
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  internalComment: z.string().optional(),
  // TODO: add history for turnover etc.
})

const validateCompanyUpsert = () => processRequestBody(upsertCompanyBodySchema)

async function handleCompanyUpsert(req: Request, res: Response) {
  const { name, description, url, internalComment, wikidataId } =
    upsertCompanyBodySchema.parse(req.body)

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
    throw new GarboAPIError('Failed to upsert company', {
      original: error,
    })
  }

  res.json(company)
}

// NOTE: Ideally we could have the same handler for both create and update operations, and provide the wikidataId as an URL param
// However, the middlewares didn't run in the expected order so the quick workaround was to just have two endpoints doing the same thing.
// Feel free to debug and improve!
router.post('/', validateCompanyUpsert(), handleCompanyUpsert)
router.post('/:wikidataId', validateCompanyUpsert(), handleCompanyUpsert)

// NOTE: Important to register this middleware after handling the POST requests for a specific wikidataId to still allow creating new companies.
router.use(
  '/:wikidataId',
  processRequest({
    params: wikidataIdParamSchema,
  }),
  async (req, res, next) => {
    const { wikidataId } = req.params
    const company = await prisma.company.findFirst({ where: { wikidataId } })
    if (!company) {
      throw new GarboAPIError('Company not found', { statusCode: 404 })
    }
    res.locals.company = company

    next()
  }
)

const goalSchema = z.object({
  description: z.string(),
  year: z.string().optional(),
  target: z.number().optional(),
  baseYear: z.string().optional(),
})

router.post(
  '/:wikidataId/goals',
  processRequest({
    body: z.object({
      goals: z.array(goalSchema),
    }),
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { goals } = req.body

    if (goals?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await createGoals(wikidataId, goals, metadata)
    }
    res.json({ ok: true })
  }
)

router.patch(
  '/:wikidataId/goals/:id',
  processRequest({
    body: z.object({ goal: goalSchema }),
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { goal } = req.body
    const { id } = req.params
    const metadata = res.locals.metadata
    await updateGoal(id, goal, metadata).catch((error) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Goal not found', {
          statusCode: 404,
          original: error,
        })
      }
      throw error
    })
    res.json({ ok: true })
  }
)

const initiativeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  year: z.string().optional(),
  scope: z.string().optional(),
})

router.post(
  '/:wikidataId/initiatives',
  processRequest({
    body: z.object({
      initiatives: z.array(initiativeSchema),
    }),
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { initiatives } = req.body

    if (initiatives?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await createInitiatives(wikidataId, initiatives, metadata)
    }
    res.json({ ok: true })
  }
)

router.patch(
  '/:wikidataId/initiatives/:id',
  processRequest({
    body: z.object({ initiative: initiativeSchema }),
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { initiative } = req.body
    const { id } = req.params
    const metadata = res.locals.metadata
    await updateInitiative(id, initiative, metadata).catch((error) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Initiative not found', {
          statusCode: 404,
          original: error,
        })
      }
      throw error
    })
    res.json({ ok: true })
  }
)

const industrySchema = z.object({
  industry: z.object({
    /** If the id is provided, the entity will be updated. Otherwise it will be created. */
    id: z.number().optional(),
    subIndustryCode: z.string(),
  }),
})

router.post(
  '/:wikidataId/industry',
  processRequest({ body: industrySchema, params: wikidataIdParamSchema }),
  async (req, res) => {
    const { industry } = req.body

    if (industry) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await upsertIndustry(
        wikidataId,
        { ...industry, gicsSubIndustryCode: industry.subIndustryCode },
        metadata
      ).catch((error) => {
        throw new GarboAPIError('Failed to update industry', {
          original: error,
          statusCode: 500,
        })
      })
    }
    res.json({ ok: true })
  }
)

router.use(
  '/:wikidataId/:year',
  validateReportingPeriod(),
  reportingPeriod(prisma)
)

router.use('/:wikidataId/:year/emissions', ensureEmissionsExists(prisma))
router.use('/:wikidataId/:year/economy', ensureEconomyExists(prisma))

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
    // TODO: add scope1And2
  }),
})

// POST//Q12345/2022-2023/emissions
router.post(
  '/:wikidataId/:year/emissions',
  processRequestBody(postEmissionsBodySchema),
  async (req, res) => {
    const {
      emissions: { scope1, scope2, scope3, statedTotalEmissions, biogenic },
    } = postEmissionsBodySchema.parse(req.body)

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
      throw new GarboAPIError('Failed to update emissions', {
        original: error,
        statusCode: 500,
      })
    }

    res.json({ ok: true })
  }
)

const postEconomyBodySchema = z.object({
  economy: z
    .object({
      turnover: z
        .object({
          value: z.number().optional(),
          currency: z.string().optional(),
        })
        .optional(),
      employees: z
        .object({
          value: z.number().optional(),
          currency: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

router.post(
  '/:wikidataId/:year/economy',
  processRequestBody(postEconomyBodySchema),
  async (req, res) => {
    const {
      economy: { turnover, employees },
    } = postEconomyBodySchema.parse(req.body)

    const metadata = res.locals.metadata
    const economy = res.locals.economy

    // Normalise currency
    if (turnover) {
      turnover.currency = turnover?.currency?.trim()?.toUpperCase()
    }

    try {
      // Only update if the input contains relevant changes
      await Promise.allSettled([
        turnover && upsertTurnover(economy, turnover, metadata),
        employees && upsertEmployees(economy, employees, metadata),
      ])
    } catch (error) {
      throw new GarboAPIError('Failed to update economy', {
        original: error,
        statusCode: 500,
      })
    }

    res.json({ ok: true })
  }
)

export default router
