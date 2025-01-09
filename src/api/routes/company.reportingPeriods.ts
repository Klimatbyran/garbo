import express from 'express'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { emissionsService } from '../services/emissionsService'
import { companyService } from '../services/companyService'
import { reportingPeriodService } from '../services/reportingPeriodService'
import { processRequest } from '../middlewares/zod-middleware'
import { postReportingPeriodsSchema, wikidataIdParamSchema } from '../schemas'

const router = express.Router()

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
 *             $ref: '#/components/schemas/ReportingPeriod'
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
  processRequest({
    body: postReportingPeriodsSchema,
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { reportingPeriods } = postReportingPeriodsSchema.parse(req.body)
    const { wikidataId } = req.params
    const metadata = res.locals.metadata!
    const company = await companyService.getCompany(wikidataId)

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
              scope1 &&
                emissionsService.upsertScope1(dbEmissions, scope1, metadata),
              scope2 &&
                emissionsService.upsertScope2(dbEmissions, scope2, metadata),
              scope3 &&
                emissionsService.upsertScope3(dbEmissions, scope3, metadata),
              statedTotalEmissions !== undefined &&
                emissionsService.upsertStatedTotalEmissions(
                  dbEmissions,
                  metadata,
                  statedTotalEmissions
                ),
              biogenic &&
                emissionsService.upsertBiogenic(
                  dbEmissions,
                  biogenic,
                  metadata
                ),
              scope1And2 &&
                emissionsService.upsertScope1And2(
                  dbEmissions,
                  scope1And2,
                  metadata
                ),
              turnover &&
                companyService.upsertTurnover({
                  economy: dbEconomy,
                  metadata,
                  turnover,
                }),
              employees &&
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

export default router
