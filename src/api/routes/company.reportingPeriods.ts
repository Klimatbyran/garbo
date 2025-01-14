import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { GarboAPIError } from '../../lib/garbo-api-error'
import { emissionsService } from '../services/emissionsService'
import { companyService } from '../services/companyService'
import { reportingPeriodService } from '../services/reportingPeriodService'
import {
  getErrorResponseSchemas,
  okResponseSchema,
  postReportingPeriodsSchema,
  wikidataIdParamSchema,
} from '../schemas'
import { getTags } from '../../openapi/utils'
import { WikidataIdParams, PostReportingPeriodsBody } from '../types'
import { metadataService } from '../services/metadataService'

export async function companyReportingPeriodsRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/reporting-periods',
    {
      schema: {
        summary: 'Create or update reporting periods',
        description:
          'Create or update reporting periods for a specific company',
        tags: getTags('ReportingPeriods'),
        params: wikidataIdParamSchema,
        body: postReportingPeriodsSchema,
        response: {
          200: okResponseSchema,
          ...getErrorResponseSchemas(404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostReportingPeriodsBody
      }>,
      reply
    ) => {
      const { wikidataId } = request.params
      const { reportingPeriods, metadata } = request.body
      const user = request.user
      const createdMetadata = await metadataService.createMetadata({
        metadata,
        user,
      })

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
                  createdMetadata,
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
                  emissionsService.upsertScope1(
                    dbEmissions,
                    scope1,
                    createdMetadata
                  ),
                scope2 &&
                  emissionsService.upsertScope2(
                    dbEmissions,
                    scope2,
                    createdMetadata
                  ),
                scope3 &&
                  emissionsService.upsertScope3(
                    dbEmissions,
                    scope3,
                    createdMetadata
                  ),
                statedTotalEmissions !== undefined &&
                  emissionsService.upsertStatedTotalEmissions(
                    dbEmissions,
                    createdMetadata,
                    statedTotalEmissions
                  ),
                biogenic &&
                  emissionsService.upsertBiogenic(
                    dbEmissions,
                    biogenic,
                    createdMetadata
                  ),
                scope1And2 &&
                  emissionsService.upsertScope1And2(
                    dbEmissions,
                    scope1And2,
                    createdMetadata
                  ),
                turnover &&
                  companyService.upsertTurnover({
                    economy: dbEconomy,
                    metadata: createdMetadata,
                    turnover,
                  }),
                employees &&
                  companyService.upsertEmployees({
                    economy: dbEconomy,
                    employees,
                    metadata: createdMetadata,
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

      reply.send({ ok: true })
    }
  )
}
