import express from 'express'
import { processRequestBody } from '../zod-middleware'
import { z } from 'zod'
import { EmissionsSchema, EconomySchema } from '../../openapi/schemas'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { Company, Metadata } from '@prisma/client'

/**
 * Express Router for handling reporting period operations
 * Provides endpoints for creating and updating company reporting periods
 */
import {
  upsertBiogenic,
  upsertScope1,
  upsertScope2,
  upsertScope3,
  upsertStatedTotalEmissions,
  upsertTurnover,
  upsertEmployees,
  upsertReportingPeriod,
  upsertEmissions,
  upsertEconomy,
} from '../../lib/prisma'

const router = express.Router()

/**
 * Zod schema for validating reporting period POST requests
 * @typedef {Object} ReportingPeriodInput
 * @property {Date} startDate - Start date of the reporting period
 * @property {Date} endDate - End date of the reporting period
 * @property {string} [reportURL] - Optional URL to the report document
 * @property {EmissionsSchema} emissions - Emissions data for the period
 * @property {EconomySchema} economy - Economic data for the period
 */
const postReportingPeriodsSchema = z.object({
  reportingPeriods: z.array(
    z
      .object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reportURL: z.string().optional(),
        emissions: EmissionsSchema,
        economy: EconomySchema,
      })
      .refine(
        ({ startDate, endDate }) => startDate.getTime() < endDate.getTime(),
        {
          message: 'startDate must be earlier than endDate',
        }
      )
  ),
})

/**
 * POST handler for creating/updating reporting periods
 * @route POST /companies/:wikidataId/reporting-periods
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {Company} res.locals.company - Company from middleware
 * @param {Metadata} res.locals.metadata - Metadata from middleware
 * @throws {GarboAPIError} When reporting period operations fail
 */
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

export default router
