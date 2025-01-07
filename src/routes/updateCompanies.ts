import express from 'express'
import { z } from 'zod'
import { processRequest, processRequestBody } from './zod-middleware'
import {
  createMetadata,
  fakeAuth,
  ensureReportingPeriod,
  ensureEmissionsExists,
  validateReportingPeriodRequest,
  validateMetadata,
  ensureEconomyExists,
  validateCompanyRequest,
  ensureCompany,
  fetchCompanyByWikidataId,
} from './middlewares'
import { GarboAPIError } from '../lib/garbo-api-error'
import { companyService } from './services/companyService'
import { goalService } from './services/goalService'
import { initiativeService } from './services/initiativeService'
import { industryService } from './services/industryService'
import { reportingPeriodService } from './services/reportingPeriodService'
import { emissionsService } from './services/emissionsService'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import {
  goalSchema,
  goalsSchema,
  industrySchema,
  initiativeSchema,
  postEconomyBodySchema,
  postEmissionsBodySchema,
  postReportingPeriodsSchema,
  wikidataIdParamSchema,
} from './schemas'

const router = express.Router()

router.use('/', fakeAuth(prisma))
router.use('/', express.json())

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/', validateMetadata(), createMetadata(prisma))

// NOTE: Ideally we could have the same handler for both create and update operations, and provide the wikidataId as an URL param
// However, the middlewares didn't run in the expected order so the quick workaround was to just have two endpoints doing the same thing.
// Feel free to debug and improve!
router.post('/', validateCompanyRequest(), ensureCompany)
router.post('/:wikidataId', validateCompanyRequest(), ensureCompany)

// NOTE: Important to register this middleware after handling the POST requests for a specific wikidataId to still allow creating new companies.
router.use(
  '/:wikidataId',
  processRequest({
    params: wikidataIdParamSchema,
  }),
  fetchCompanyByWikidataId(prisma)
)

router.post(
  '/:wikidataId/goals',
  processRequest({
    body: goalsSchema,
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { goals } = req.body

    if (goals?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await goalService.createGoals(wikidataId, goals, metadata!)
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
    await goalService.updateGoal(id, goal, metadata!).catch((error) => {
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

router.delete(
  '/:wikidataId/goals/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await goalService.deleteGoal(id).catch((error) => {
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

      await initiativeService.createInitiatives(
        wikidataId,
        initiatives,
        metadata!
      )
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
    await initiativeService
      .updateInitiative(id, initiative, metadata!)
      .catch((error) => {
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

router.delete(
  '/:wikidataId/initiatives/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await initiativeService.deleteInitiative(id).catch((error) => {
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
      await industryService
        .updateIndustry(wikidataId, { subIndustryCode }, metadata!)
        .catch((error) => {
          throw new GarboAPIError('Failed to update industry', {
            original: error,
            statusCode: 500,
          })
        })
    } else {
      console.log('creating industry', subIndustryCode)
      await industryService
        .createIndustry(wikidataId, { subIndustryCode }, metadata!)
        .catch((error) => {
          throw new GarboAPIError('Failed to create industry', {
            original: error,
            statusCode: 500,
          })
        })
    }

    res.json({ ok: true })
  }
)

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
            const reportingPeriod =
              await reportingPeriodService.upsertReportingPeriod(
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
              emissionsService.upsertEmissions({
                emissionsId: reportingPeriod.emissions?.id ?? 0,
                reportingPeriodId: reportingPeriod.id,
              }),
              companyService.upsertEconomy({
                economyId: reportingPeriod.economy?.id ?? 0,
                reportingPeriodId: reportingPeriod.id,
              }),
            ])

            const {
              scope1,
              scope2,
              scope3,
              statedTotalEmissions,
              biogenic,
              scope1And2,
            } = emissions
            const { turnover, employees } = economy

            // Normalise currency
            if (turnover?.currency) {
              turnover.currency = turnover.currency.trim().toUpperCase()
            }

            await Promise.allSettled([
              scope1 !== undefined &&
                emissionsService.upsertScope1(dbEmissions, scope1, metadata),
              scope2 !== undefined &&
                emissionsService.upsertScope2(dbEmissions, scope2, metadata),
              scope3 &&
                emissionsService.upsertScope3(dbEmissions, scope3, metadata),
              statedTotalEmissions !== undefined &&
                emissionsService.upsertStatedTotalEmissions(
                  dbEmissions,
                  statedTotalEmissions,
                  metadata
                ),
              biogenic !== undefined &&
                emissionsService.upsertBiogenic(
                  dbEmissions,
                  biogenic,
                  metadata
                ),
              scope1And2 !== undefined &&
                emissionsService.upsertScope1And2(
                  dbEmissions,
                  scope1And2,
                  metadata
                ),
              turnover !== undefined &&
                companyService.upsertTurnover(dbEconomy, turnover, metadata),
              employees !== undefined &&
                companyService.upsertEmployees({
                  economy: dbEconomy,
                  employees,
                  metadata,
                }),
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

router.patch(
  '/:wikidataId/report-url',
  processRequest({
    params: z.object({
      wikidataId: z.string(),
    }),
    body: z.object({
      year: z.string(),
      reportURL: z.string().url(),
    }),
  }),
  async (req, res) => {
    const { reportURL, year } = req.body
    const company = res.locals.company!

    try {
      const updatedPeriod =
        await reportingPeriodService.updateReportingPeriodReportURL(
          company,
          year,
          reportURL
        )

      res.json({
        ok: true,
        message: updatedPeriod
          ? 'Sucessfully updated reportUrl'
          : ' No reporting period found',
      })
    } catch (error) {
      throw new GarboAPIError('Failed to update reportUrl', {
        original: error,
        statusCode: 500,
      })
    }
  }
)

router.use(
  '/:wikidataId/:year',
  validateReportingPeriodRequest(),
  ensureReportingPeriod(prisma)
)

router.use('/:wikidataId/:year/emissions', ensureEmissionsExists(prisma))
router.use('/:wikidataId/:year/economy', ensureEconomyExists(prisma))

// POST /Q12345/2022-2023/emissions
router.post(
  '/:wikidataId/:year/emissions',
  processRequestBody(postEmissionsBodySchema),
  async (req, res) => {
    const { emissions = {} } = postEmissionsBodySchema.parse(req.body)
    const {
      scope1,
      scope2,
      scope3,
      scope1And2,
      statedTotalEmissions,
      biogenic,
    } = emissions

    const metadata = res.locals.metadata!
    const dbEmissions = res.locals.emissions!

    try {
      // Only update if the input contains relevant changes
      // NOTE: The types for partial inputs like scope1 and scope2 say the objects always exist. However, this is not true.
      // There seems to be a type error in zod which doesn't take into account optional objects.

      await Promise.allSettled([
        scope1 !== undefined &&
          emissionsService.upsertScope1(dbEmissions, scope1, metadata),
        scope2 !== undefined &&
          emissionsService.upsertScope2(dbEmissions, scope2, metadata),
        scope3 && emissionsService.upsertScope3(dbEmissions, scope3, metadata),
        scope1And2 !== undefined &&
          emissionsService.upsertScope1And2(dbEmissions, scope1And2, metadata),
        statedTotalEmissions !== undefined &&
          emissionsService.upsertStatedTotalEmissions(
            dbEmissions,
            statedTotalEmissions,
            metadata
          ),
        biogenic !== undefined &&
          emissionsService.upsertBiogenic(dbEmissions, biogenic, metadata),
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
        turnover !== undefined &&
          companyService.upsertTurnover(economy, turnover, metadata),
        employees !== undefined &&
          companyService.upsertEmployees({ economy, employees, metadata }),
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
