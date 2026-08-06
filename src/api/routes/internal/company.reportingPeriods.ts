import {
  FastifyInstance,
  AuthenticatedFastifyRequest,
  FastifyRequest,
} from 'fastify'
import { emissionsService } from '../../services/emissionsService'
import { companyService } from '../../services/companyService'
import {
  companyReportService,
  CompanyReportScopeError,
} from '../../services/companyReportService'
import { reportingPeriodService } from '../../services/reportingPeriodService'
import {
  getErrorSchemas,
  postReportingPeriodsSchema,
  companyIdParamSchema,
  okResponseSchema,
  ReportingPeriodYearsSchema,
} from '../../schemas'
import { getTags } from '../../../config/openapi'
import {
  CompanyIdParams,
  PostReportingPeriodsBody,
  DefaultEmissions,
} from '../../types'
import { metadataService } from '../../services/metadataService'
import _ from 'lodash'
import { prisma } from '../../../lib/prisma'
import type {
  BiogenicEmissions,
  Metadata,
  Scope1,
  Scope1And2,
  StatedTotalEmissions,
} from '@prisma/client'
import type { OptionalNullable } from '../../../lib/type-utils'

/** Shape of `emissions` when purging (see `replaceAllEmissions` prisma include). */
type EmissionsDeletionTarget = {
  scope3: {
    id: string
    categories: Array<{ id: string }>
    statedTotalEmissions: { id: string } | null
  } | null
  scope1: { id: string } | null
  scope2: { id: string } | null
  scope1And2: { id: string } | null
  statedTotalEmissions: { id: string } | null
}

type BodyEmissions = NonNullable<
  PostReportingPeriodsBody['reportingPeriods'][number]['emissions']
>
type Scope2UpsertInput = Parameters<typeof emissionsService.upsertScope2>[1]
type Scope1UpsertInput = Omit<Scope1, 'id' | 'metadataId' | 'emissionsId'>
type Scope1And2UpsertInput = Omit<
  Scope1And2,
  'id' | 'metadataId' | 'emissionsId'
>
type StatedTotalUpsertInput = Omit<
  StatedTotalEmissions,
  'id' | 'metadataId' | 'scope3Id' | 'emissionsId'
>
type BiogenicUpsertInput = OptionalNullable<
  Omit<BiogenicEmissions, 'id' | 'metadataId' | 'emissionsId'>
>

// Helper functions for emission deletion
async function deleteScope3Emissions(emissions: EmissionsDeletionTarget) {
  if (!emissions.scope3) return

  for (const cat of emissions.scope3.categories) {
    await emissionsService.deleteScope3Category(cat.id)
  }

  if (emissions.scope3.statedTotalEmissions?.id) {
    await emissionsService.deleteStatedTotalEmissions(
      emissions.scope3.statedTotalEmissions.id
    )
  }

  await emissionsService.deleteScope3(emissions.scope3.id)
}

async function deleteScope1And2Emissions(emissions: EmissionsDeletionTarget) {
  if (emissions.scope1?.id) {
    console.log('deleting scope1', emissions.scope1.id)
    await emissionsService.deleteScope1(emissions.scope1.id)
  }
  if (emissions.scope2?.id) {
    console.log('deleting scope2', emissions.scope2.id)
    await emissionsService.deleteScope2(emissions.scope2.id)
  }
  if (emissions.scope1And2?.id) {
    await emissionsService.deleteScope1And2(emissions.scope1And2.id)
  }
}

async function deleteStatedTotalEmissions(emissions: EmissionsDeletionTarget) {
  if (emissions.statedTotalEmissions?.id) {
    await emissionsService.deleteStatedTotalEmissions(
      emissions.statedTotalEmissions.id
    )
  }
}

function buildScope1Promise(
  scope1Payload: BodyEmissions['scope1'],
  dbEmissions: DefaultEmissions,
  createdMetadata: Metadata,
  verifiedMetadata: Metadata
) {
  const existingScope1Id = dbEmissions.scope1?.id

  if (scope1Payload === null && existingScope1Id) {
    return emissionsService.deleteScope1(existingScope1Id)
  }

  if (scope1Payload === undefined || scope1Payload === null) {
    // No change requested for scope1
    return false
  }

  const metadataForScope1 = scope1Payload.verified
    ? verifiedMetadata
    : createdMetadata

  return emissionsService.upsertScope1(
    dbEmissions,
    _.omit(scope1Payload, 'verified') as Scope1UpsertInput,
    metadataForScope1
  )
}

function buildScope2Promise(
  scope2Payload: BodyEmissions['scope2'],
  dbEmissions: DefaultEmissions,
  createdMetadata: Metadata,
  verifiedMetadata: Metadata
) {
  const existingScope2Id = dbEmissions.scope2?.id

  if (scope2Payload === null && existingScope2Id) {
    return emissionsService.deleteScope2(existingScope2Id)
  }

  if (scope2Payload === undefined || scope2Payload === null) {
    // No change requested for scope2
    return false
  }

  const metadataForScope2 = scope2Payload.verified
    ? verifiedMetadata
    : createdMetadata

  return emissionsService.upsertScope2(
    dbEmissions,
    _.omit(scope2Payload, 'verified') as Scope2UpsertInput,
    metadataForScope2
  )
}

export async function companyReportingPeriodsRoutes(app: FastifyInstance) {
  app.post(
    '/:id/reporting-periods',
    {
      schema: {
        summary: 'Create or update reporting periods',
        description:
          'Create or update reporting periods for a specific company. This is used to update emissions and economy data.',
        tags: getTags('ReportingPeriods'),
        params: companyIdParamSchema,
        body: postReportingPeriodsSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostReportingPeriodsBody
      }>,
      reply
    ) => {
      const {
        reportingPeriods,
        metadata,
        replaceAllEmissions,
        companyReportId: bodyCompanyReportId,
        reportUrl,
        reportSourceUrl,
        reportS3Url,
        reportSha256,
        documentReportYear: bodyDocumentReportYear,
        registryReportId: bodyRegistryReportId,
      } = request.body
      const { id } = request.params
      const user = request.user
      let company

      try {
        company = await companyService.getCompanyByInternalId(id)
      } catch (error) {
        console.error(`Error: ${error}`)
        return reply.status(404).send({
          code: '404',
          message: `There is no company with id ${id}`,
        })
      }

      let resolvedCompanyReportId: string
      let documentReportYear: string | undefined
      try {
        const prepared =
          await companyReportService.prepareCompanyReportForPeriodSave(
            company,
            reportingPeriods,
            {
              bodyCompanyReportId,
              registryReportId: bodyRegistryReportId,
              documentReportYear: bodyDocumentReportYear,
              reportUrl,
              reportSourceUrl,
              reportS3Url,
              reportSha256,
            }
          )
        resolvedCompanyReportId = prepared.companyReportId
        documentReportYear = prepared.documentReportYear
      } catch (error) {
        if (error instanceof CompanyReportScopeError) {
          return reply.status(400).send({
            code: '400',
            message: error.message,
          })
        }
        throw error
      }

      // Purge emissions only on the CompanyReport shell being saved (not the whole company).
      if (replaceAllEmissions) {
        if (process.env.NODE_ENV === 'production') {
          return reply.status(403).send({
            code: '403',
            message: 'replaceAllEmissions is not allowed in production',
          })
        }
        const existingPeriods = await prisma.reportingPeriod.findMany({
          where: {
            companyId: company.id,
            companyReportId: resolvedCompanyReportId,
          },
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
            companyReportId: periodCompanyReportId,
            reportURL,
            reportS3Url,
            reportSha256,
          }) => {
            const year = endDate.getFullYear().toString()

            const companyReportIdForPeriod =
              await companyReportService.companyReportIdForPeriodSave(
                company.id,
                resolvedCompanyReportId,
                periodCompanyReportId,
                documentReportYear
              )

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
                  reportS3Url: reportS3Url ?? undefined,
                  reportSha256: reportSha256 ?? undefined,
                  year,
                  companyReportId: companyReportIdForPeriod,
                }
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
              buildScope1Promise(
                scope1,
                dbEmissions,
                createdMetadata,
                verifiedMetadata
              ),
              buildScope2Promise(
                scope2,
                dbEmissions,
                createdMetadata,
                verifiedMetadata
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
                    })
                ),
              statedTotalEmissions !== undefined &&
                emissionsService.upsertStatedTotalEmissions(
                  dbEmissions,
                  statedTotalEmissions?.verified
                    ? verifiedMetadata
                    : createdMetadata,
                  _.omit(
                    statedTotalEmissions,
                    'verified'
                  ) as StatedTotalUpsertInput
                ),
              biogenic !== undefined &&
                emissionsService.upsertBiogenic(
                  dbEmissions,
                  _.omit(biogenic, 'verified') as BiogenicUpsertInput,
                  biogenic?.verified ? verifiedMetadata : createdMetadata
                ),
              scope1And2 !== undefined &&
                emissionsService.upsertScope1And2(
                  dbEmissions,
                  _.omit(scope1And2, 'verified') as Scope1And2UpsertInput,
                  scope1And2?.verified ? verifiedMetadata : createdMetadata
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
          }
        )
      )

      for (const result of results) {
        if (result.status === 'rejected') {
          console.error(
            'ERROR Creation or update of reporting periods failed',
            result.reason
          )
          if (result.reason instanceof CompanyReportScopeError) {
            return reply.status(400).send({
              code: '400',
              message: result.reason.message,
            })
          }
          return reply.status(500).send({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Creation or update of reporting periods failed.',
          })
        }
      }

      const linkResult =
        await companyReportService.ensureCompanyReportRegistryLink(
          resolvedCompanyReportId,
          company,
          reportingPeriods,
          {
            bodyCompanyReportId,
            registryReportId: bodyRegistryReportId,
            documentReportYear,
            reportUrl,
            reportSourceUrl,
            reportS3Url,
            reportSha256,
          }
        )

      return reply.send({
        ok: true,
        companyReportId: linkResult?.companyReportId ?? resolvedCompanyReportId,
        registryReportId: linkResult?.registryReportId ?? null,
      })
    }
  )
}

export async function companyPublicReportingPeriodsRoutes(
  app: FastifyInstance
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
            record.endDate.getFullYear().toString()
          )
        )
      )

      distinctYears.sort()

      reply.send(distinctYears)
    }
  )
}
