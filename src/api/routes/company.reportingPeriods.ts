import {
  FastifyInstance,
  AuthenticatedFastifyRequest,
  FastifyRequest,
} from 'fastify'
import { emissionsService } from '../services/emissionsService'
import { companyService } from '../services/companyService'
import { reportingPeriodService } from '../services/reportingPeriodService'
import {
  getErrorSchemas,
  postReportingPeriodsSchema,
  wikidataIdParamSchema,
  okResponseSchema,
  ReportingPeriodYearsSchema,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { WikidataIdParams, PostReportingPeriodsBody } from '../types'
import { metadataService } from '../services/metadataService'
import _ from 'lodash'
import { prisma } from '../../lib/prisma'

export async function companyReportingPeriodsRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/reporting-periods',
    {
      schema: {
        summary: 'Create or update reporting periods',
        description:
          'Create or update reporting periods for a specific company. This is used to update emissions and economy data.',
        tags: getTags('ReportingPeriods'),
        params: wikidataIdParamSchema,
        body: postReportingPeriodsSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostReportingPeriodsBody
      }>,
      reply,
    ) => {
      const { wikidataId } = request.params
      const { reportingPeriods, metadata } = request.body
      const user = request.user
      let company

      try {
        company = await companyService.getCompany(wikidataId)
      } catch (error) {
        console.error(`Error: ${error}`)
        return reply.status(404).send({
          code: '404',
          message: `There is no company with wikidataId ${wikidataId}`,
        })
      }

      const results = await Promise.allSettled(
        reportingPeriods.map(
          async ({
            emissions = {},
            economy = {},
            startDate,
            endDate,
            reportURL,
          }) => {
            const year = endDate.getFullYear().toString()
            const createdMetadata = await metadataService.createMetadata({
              metadata,
              user,
              verified: false,
            })
            const verifiedMetadata = await metadataService.createMetadata({
              metadata,
              user,
              verified: true,
            })
            const reportingPeriod =
              await reportingPeriodService.upsertReportingPeriod(
                company,
                createdMetadata,
                {
                  startDate,
                  endDate,
                  reportURL,
                  year,
                },
              )

            const [dbEmissions, dbEconomy] = await Promise.all([
              emissionsService.upsertEmissions({
                emissionsId: reportingPeriod.emissions?.id ?? '',
                reportingPeriodId: reportingPeriod.id,
              }),
              companyService.upsertEconomy({
                economyId: reportingPeriod.economy?.id ?? '',
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
                  _.omit(scope1, 'verified'),
                  scope1.verified ? verifiedMetadata : createdMetadata,
                ),
              scope2 &&
                emissionsService.upsertScope2(
                  dbEmissions,
                  _.omit(scope2, 'verified'),
                  scope2.verified ? verifiedMetadata : createdMetadata,
                ),
              scope3 &&
                emissionsService.upsertScope3(
                  dbEmissions,
                  {
                    ...scope3,
                    categories: scope3.categories?.map((category) => ({
                      ...category,
                      total: category.total ?? null,
                    })),
                    statedTotalEmissions: scope3.statedTotalEmissions
                      ? {
                          ...scope3.statedTotalEmissions,
                          total: scope3.statedTotalEmissions.total ?? null,
                        }
                      : undefined,
                  },
                  (verified: boolean) =>
                    metadataService.createMetadata({
                      metadata,
                      user,
                      verified,
                    }),
                ),
              statedTotalEmissions !== undefined &&
                emissionsService.upsertStatedTotalEmissions(
                  dbEmissions,
                  statedTotalEmissions.verified
                    ? verifiedMetadata
                    : createdMetadata,
                  _.omit(statedTotalEmissions, 'verified'),
                ),
              biogenic &&
                emissionsService.upsertBiogenic(
                  dbEmissions,
                  _.omit(biogenic, 'verified'),
                  biogenic.verified ? verifiedMetadata : createdMetadata,
                ),
              scope1And2 &&
                emissionsService.upsertScope1And2(
                  dbEmissions,
                  _.omit(scope1And2, 'verified'),
                  scope1And2.verified ? verifiedMetadata : createdMetadata,
                ),
              turnover &&
                companyService.upsertTurnover({
                  economy: dbEconomy,
                  metadata: turnover.verified
                    ? verifiedMetadata
                    : createdMetadata,
                  turnover: _.omit(turnover, 'verified'),
                }),
              employees &&
                companyService.upsertEmployees({
                  economy: dbEconomy,
                  employees: _.omit(employees, 'verified'),
                  metadata: employees.verified
                    ? verifiedMetadata
                    : createdMetadata,
                }),
            ])
          },
        ),
      )

      for (const result of results) {
        if (result.status === 'rejected') {
          console.error(
            'ERROR Creation or update of reporting periods failed',
            result.reason,
          )
          return reply.status(500).send({
            message: 'Creation or update of reporting periods failed.',
          })
        }
      }

      return reply.send({ ok: true })
    },
  )
}

export async function companyPublicReportingPeriodsRoutes(
  app: FastifyInstance,
) {
  app.get(
    '/years',
    {
      schema: {
        summary: 'Get list of reporting periods',
        description:
          "Retrieve a list of all existing reporting periods identified by it's end date year",
        tags: getTags('ReportingPeriods'),
        response: {
          200: ReportingPeriodYearsSchema,
        },
      },
    },
    async (_request: FastifyRequest, reply) => {
      const reportingPeriods = await prisma.reportingPeriod.findMany({
        select: {
          endDate: true,
        },
      })

      // Extract unique years from the endDate field in JavaScript
      const distinctYears = Array.from(
        new Set(
          reportingPeriods.map((record) =>
            record.endDate.getFullYear().toString(),
          ),
        ),
      )

      distinctYears.sort()

      reply.send(distinctYears)
    },
  )
}
