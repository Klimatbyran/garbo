import express from 'express'
import { processRequest, processRequestBody } from '../zod-middleware'
import { upsertCompany } from '../../lib/prisma'
import { fakeAuth, createMetadata, validateMetadata } from '../middlewares'
import { prisma } from '../../lib/prisma'
import { Company } from '@prisma/client'
import { wikidataIdParamSchema } from '../../openapi/schemas'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { CompanyInputSchema } from '../../openapi/registry'

// Import the new route handlers
import updateGoals from './companies/company.goals'
import updateInitiatives from './companies/company.initiatives'
import updateIndustry from './companies/company.industry'
import updateReportingPeriods from './companies/company.reporting-periods'

const router = express.Router()

router.use('/', fakeAuth(prisma))
router.use('/', express.json())

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/', validateMetadata(), createMetadata(prisma))

import { CompanyInputSchema } from '../../openapi/registry'

const validateCompanyUpsert = () => processRequestBody(CompanyInputSchema)

async function handleCompanyUpsert(req: Request, res: Response) {
  const { name, description, url, internalComment, wikidataId } = CompanyInputSchema.parse(req.body)

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
/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company with basic information
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateCompanyUpsert(), handleCompanyUpsert)

/**
 * @swagger
 * /companies/{wikidataId}:
 *   post:
 *     summary: Update a company
 *     description: Update an existing company's information
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:wikidataId', validateCompanyUpsert(), handleCompanyUpsert)

// Company existence middleware
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

// Mount the new route handlers
router.use('/', updateGoals)
router.use('/', updateInitiatives)
router.use('/', updateIndustry)
router.use('/', updateReportingPeriods)

export default router
 *   post:
 *     summary: Create company goals
 *     description: Create new goals for a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goals:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Goal'
 *     responses:
 *       200:
 *         description: Goals created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Company not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:wikidataId/goals',
  processRequest({
    body: z.object({
      goals: z.array(GoalSchema),
    }),
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { goals } = req.body

    if (goals?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await createGoals(wikidataId, goals, metadata!)
    }
    res.json({ ok: true })
  }
)

/**
 * @swagger
 * /companies/{wikidataId}/goals/{id}:
 *   patch:
 *     summary: Update a company goal
 *     description: Update an existing goal for a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 $ref: '#/components/schemas/Goal'
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Goal not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:wikidataId/goals/:id',
  processRequest({
    body: z.object({ goal: GoalSchema }),
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { goal } = req.body
    const { id } = req.params
    const metadata = res.locals.metadata
    await updateGoal(id, goal, metadata!).catch((error) => {
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

import { InitiativeSchema } from '../../openapi/schemas'

/**
 * @swagger
 * /companies/{wikidataId}/initiatives:
 *   post:
 *     summary: Create company initiatives
 *     description: Create new initiatives for a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initiatives:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Initiative'
 *     responses:
 *       200:
 *         description: Initiatives created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Company not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:wikidataId/initiatives',
  processRequest({
    body: z.object({
      initiatives: z.array(InitiativeSchema),
    }),
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { initiatives } = req.body

    if (initiatives?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await createInitiatives(wikidataId, initiatives, metadata!)
    }
    res.json({ ok: true })
  }
)

/**
 * @swagger
 * /companies/{wikidataId}/initiatives/{id}:
 *   patch:
 *     summary: Update a company initiative
 *     description: Update an existing initiative for a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Initiative ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initiative:
 *                 $ref: '#/components/schemas/Initiative'
 *     responses:
 *       200:
 *         description: Initiative updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Initiative not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:wikidataId/initiatives/:id',
  processRequest({
    body: z.object({ initiative: InitiativeSchema }),
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { initiative } = req.body
    const { id } = req.params
    const metadata = res.locals.metadata
    await updateInitiative(id, initiative, metadata!).catch((error) => {
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
    subIndustryCode: z.string(),
  }),
})

/**
 * @swagger
 * /companies/{wikidataId}/industry:
 *   post:
 *     summary: Update company industry classification
 *     description: Update or create industry classification for a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               industry:
 *                 $ref: '#/components/schemas/IndustrySchema'
 *     responses:
 *       200:
 *         description: Industry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Company not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:wikidataId/industry',
  processRequest({ body: industrySchema, params: wikidataIdParamSchema }),
  async (req, res) => {
    const { industry } = req.body
    // NOTE: This extra check is only necessary because we don't get correct TS types from the zod middleware processRequest().
    // Ideally, we could update the generic types of the zod-middleware to return the exact inferred schema, instead of turning everything into optional fields.
    const subIndustryCode = industry?.subIndustryCode
    if (!subIndustryCode) {
      throw new GarboAPIError('Unable to update industry')
    }

    const { wikidataId } = req.params
    const metadata = res.locals.metadata

    const current = await prisma.industry.findFirst({
      where: { companyWikidataId: wikidataId },
    })

    if (current) {
      console.log('updating industry', subIndustryCode)
      await updateIndustry(wikidataId, { subIndustryCode }, metadata!).catch(
        (error) => {
          throw new GarboAPIError('Failed to update industry', {
            original: error,
            statusCode: 500,
          })
        }
      )
    } else {
      console.log('creating industry', subIndustryCode)
      await createIndustry(wikidataId, { subIndustryCode }, metadata!).catch(
        (error) => {
          throw new GarboAPIError('Failed to create industry', {
            original: error,
            statusCode: 500,
          })
        }
      )
    }

    res.json({ ok: true })
  }
)

import { EmissionsSchema as emissionsSchema, EconomySchema as economySchema } from '../../openapi/schemas'

const postReportingPeriodsSchema = z.object({
  reportingPeriods: z.array(
    z
      .object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reportURL: z.string().optional(),
        emissions: emissionsSchema,
        economy: economySchema,
      })
      .refine(
        ({ startDate, endDate }) => startDate.getTime() < endDate.getTime(),
        {
          message: 'startDate must be earlier than endDate',
        }
      )
  ),
})

router.post(
  '/:wikidataId/reporting-periods',
  processRequestBody(postReportingPeriodsSchema),
  async (req, res) => {
    const { reportingPeriods } = postReportingPeriodsSchema.parse(req.body)
    const metadata = res.locals.metadata!
    const company = res.locals.company

    try {
      await Promise.allSettled(
        reportingPeriods.map(
          async ({
            emissions = {},
            economy = {},
            startDate,
            endDate,
            reportURL,
          }) => {
            const year = endDate.getFullYear().toString()
            const reportingPeriod = await upsertReportingPeriod(
              company,
              metadata,
              {
                startDate,
                endDate,
                reportURL,
                year,
              }
            )

            const [dbEmissions, dbEconomy] = await Promise.all([
              upsertEmissions({
                emissionsId: reportingPeriod.emissionsId ?? 0,
                companyId: company.wikidataId,
                year,
              }),
              upsertEconomy({
                economyId: reportingPeriod.economyId ?? 0,
                companyId: company.wikidataId,
                year,
              }),
            ])

            const { scope1, scope2, scope3, statedTotalEmissions, biogenic } =
              emissions
            const { turnover, employees } = economy

            // Normalise currency
            if (turnover?.currency) {
              turnover.currency = turnover.currency.trim().toUpperCase()
            }

            await Promise.allSettled([
              scope1 && upsertScope1(dbEmissions, scope1, metadata),
              scope2 && upsertScope2(dbEmissions, scope2, metadata),
              scope3 && upsertScope3(dbEmissions, scope3, metadata),
              statedTotalEmissions &&
                upsertStatedTotalEmissions(
                  dbEmissions,
                  statedTotalEmissions,
                  metadata
                ),
              biogenic && upsertBiogenic(dbEmissions, biogenic, metadata),
              turnover && upsertTurnover(dbEconomy, turnover, metadata),
              employees && upsertEmployees(dbEconomy, employees, metadata),
            ])
          }
        )
      )
    } catch (error) {
      throw new GarboAPIError('Failed to update reporting periods', {
        original: error,
        statusCode: 500,
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

const postEmissionsBodySchema = z.object({
  emissions: emissionsSchema,
})

// POST /Q12345/2022-2023/emissions
router.post(
  '/:wikidataId/:year/emissions',
  processRequestBody(postEmissionsBodySchema),
  async (req, res) => {
    const { emissions = {} } = postEmissionsBodySchema.parse(req.body)
    const { scope1, scope2, scope3, statedTotalEmissions, biogenic } = emissions

    const metadata = res.locals.metadata!
    const dbEmissions = res.locals.emissions!

    try {
      // Only update if the input contains relevant changes
      // NOTE: The types for partial inputs like scope1 and scope2 say the objects always exist. However, this is not true.
      // There seems to be a type error in zod which doesn't take into account optional objects.

      await Promise.allSettled([
        scope1 && upsertScope1(dbEmissions, scope1, metadata),
        scope2 && upsertScope2(dbEmissions, scope2, metadata),
        scope3 && upsertScope3(dbEmissions, scope3, metadata),
        statedTotalEmissions &&
          upsertStatedTotalEmissions(
            dbEmissions,
            statedTotalEmissions,
            metadata
          ),
        biogenic && upsertBiogenic(dbEmissions, biogenic, metadata),
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
  economy: economySchema,
})

router.post(
  '/:wikidataId/:year/economy',
  processRequestBody(postEconomyBodySchema),
  async (req, res) => {
    const parsedBody = postEconomyBodySchema.parse(req.body)
    const { turnover, employees } = parsedBody.economy ?? {}

    const metadata = res.locals.metadata!
    const economy = res.locals.economy!

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
