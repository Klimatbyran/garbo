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
 * @swagger
 * /companies/{wikidataId}/reporting-periods:
 *   post:
 *     summary: Create or update reporting periods
 *     description: Creates or updates reporting periods for a specific company
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
 *             required:
 *               - reportingPeriods
 *             properties:
 *               reportingPeriods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - startDate
 *                     - endDate
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     reportURL:
 *                       type: string
 *                     emissions:
 *                       $ref: '#/components/schemas/EmissionsSchema'
 *                     economy:
 *                       $ref: '#/components/schemas/EconomySchema'
 *     responses:
 *       200:
 *         description: Reporting periods updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
