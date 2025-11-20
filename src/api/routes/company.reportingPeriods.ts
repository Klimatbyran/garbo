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

// Helper functions for emission deletion
async function deleteScope3Emissions(emissions: any) {
  if (!emissions.scope3) return
  
  for (const cat of emissions.scope3.categories) {
    await emissionsService.deleteScope3Category(cat.id)
  }
  
  if (emissions.scope3.statedTotalEmissions?.id) {
    await emissionsService.deleteStatedTotalEmissions(
      emissions.scope3.statedTotalEmissions.id,
    )
  }
  
  await emissionsService.deleteScope3(emissions.scope3.id)
}

async function deleteScope1And2Emissions(emissions: any) {
  if (emissions.scope1?.id) {
    await emissionsService.deleteScope1(emissions.scope1.id)
  }
  if (emissions.scope2?.id) {
    await emissionsService.deleteScope2(emissions.scope2.id)
  }
  if (emissions.scope1And2?.id) {
    await emissionsService.deleteScope1And2(emissions.scope1And2.id)
  }
}

async function deleteStatedTotalEmissions(emissions: any) {
  if (emissions.statedTotalEmissions?.id) {
    await emissionsService.deleteStatedTotalEmissions(
      emissions.statedTotalEmissions.id,
    )
  }
}

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
      const { reportingPeriods, metadata, replaceAllEmissions } = request.body
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

      // If replaceAllEmissions is set, purge existing emissions for ALL reporting periods for the company before upserting
      if (replaceAllEmissions) {
        if (process.env.NODE_ENV === 'production') {
          return reply.status(403).send({
            code: '403',
            message: 'replaceAllEmissions is not allowed in production',
          })
        }
        const existingPeriods = await prisma.reportingPeriod.findMany({
          where: { companyId: company.wikidataId },
          include: {
            emissions: {
              include: {
                scope1: { select: { id: true } },
                scope2: { select: { id: true } },
                scope1And2: { select: { id: true } },
                statedTotalEmissions: { select: { id: true } },
                scope3: {
                  include: {
                    categories: { select: { id: true } },
                    statedTotalEmissions: { select: { id: true } },
                  },
                },
              },
            },
          },
        })

        // Purge only Scope 1, Scope 2, Scope 1+2, and Scope 3 (incl. categories and Scope 3 stated total)
        for (const period of existingPeriods) {
          const e = period.emissions
          if (!e) continue
          
          await deleteScope3Emissions(e)
          await deleteScope1And2Emissions(e)
          await deleteStatedTotalEmissions(e)
        }
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
              scope1 !== undefined &&
                emissionsService.upsertScope1(
                  dbEmissions,
                  _.omit(scope1, 'verified') as any,
                  scope1?.verified ? verifiedMetadata : createdMetadata,
                ),
              scope2 !== undefined &&
                emissionsService.upsertScope2(
                  dbEmissions,
                  _.omit(scope2, 'verified') as any,
                  scope2?.verified ? verifiedMetadata : createdMetadata,
                ),
              scope3 !== undefined &&
                emissionsService.upsertScope3(
                  dbEmissions,
                  scope3 === null
                    ? {}
                    : {
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
                  statedTotalEmissions?.verified
                    ? verifiedMetadata
                    : createdMetadata,
                  _.omit(statedTotalEmissions, 'verified') as any,
                ),
              biogenic !== undefined &&
                emissionsService.upsertBiogenic(
                  dbEmissions,
                  _.omit(biogenic, 'verified') as any,
                  biogenic?.verified ? verifiedMetadata : createdMetadata,
                ),
              scope1And2 !== undefined &&
                emissionsService.upsertScope1And2(
                  dbEmissions,
                  _.omit(scope1And2, 'verified') as any,
                  scope1And2?.verified ? verifiedMetadata : createdMetadata,
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
