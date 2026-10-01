import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
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
import { resolveSourcePageUrl } from '../../../lib/sourceReference'
import type {
  BiogenicEmissions,
  Metadata,
  Scope1,
  Scope1And2,
  StatedTotalEmissions,
  User,
} from '@prisma/client'
import { Prisma } from '@prisma/client'
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

type ProvenancePayload = {
  sourceReference?: string
  pageNumber?: number
  verified?: boolean
}

async function createDatapointMetadata({
  baseMetadata,
  provenance,
  user,
  verified,
  reportS3Url,
  previousValue,
}: {
  baseMetadata?: Partial<Metadata>
  provenance?: ProvenancePayload
  user: User
  verified: boolean
  reportS3Url?: string | null
  previousValue?: Prisma.InputJsonValue | null
}) {
  const sourcePageUrl = resolveSourcePageUrl({
    storagePdfUrl: reportS3Url,
    pageNumber: provenance?.pageNumber,
    sourceReference: provenance?.sourceReference,
  })

  // Never persist client-supplied sourcePageUrl from baseMetadata — always
  // derive from allowlisted storage URL + pageNumber / sourceReference.
  const { sourcePageUrl: _ignoredClientSourcePageUrl, ...safeBaseMetadata } =
    (baseMetadata ?? {}) as Partial<Metadata> & {
      sourcePageUrl?: string | null
    }

  return metadataService.createMetadata({
    metadata: {
      ...safeBaseMetadata,
      ...(provenance?.sourceReference
        ? { sourceReference: provenance.sourceReference }
        : {}),
      ...(sourcePageUrl ? { sourcePageUrl } : {}),
    },
    user,
    verified,
    previousValue,
  })
}

function stripProvenanceFields<T extends ProvenancePayload>(payload: T) {
  return _.omit(payload, 'verified', 'sourceReference', 'pageNumber')
}

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

async function buildScope1Promise(
  scope1Payload: BodyEmissions['scope1'],
  dbEmissions: DefaultEmissions,
  baseMetadata: Partial<Metadata> | undefined,
  user: User,
  reportS3Url?: string | null
) {
  const existingScope1Id = dbEmissions.scope1?.id

  if (scope1Payload === null && existingScope1Id) {
    return emissionsService.deleteScope1(existingScope1Id)
  }

  if (scope1Payload === undefined || scope1Payload === null) {
    return false
  }

  const existing = existingScope1Id
    ? await prisma.scope1.findUnique({
        where: { id: existingScope1Id },
        select: { total: true, unit: true },
      })
    : null
  const next = stripProvenanceFields(scope1Payload) as Scope1UpsertInput
  const previousValue =
    existing &&
    (existing.total !== next.total || existing.unit !== next.unit)
      ? ({ total: existing.total, unit: existing.unit } satisfies Prisma.InputJsonValue)
      : undefined

  const metadataForScope1 = await createDatapointMetadata({
    baseMetadata,
    provenance: scope1Payload,
    user,
    verified: scope1Payload.verified ?? false,
    reportS3Url,
    previousValue,
  })

  return emissionsService.upsertScope1(dbEmissions, next, metadataForScope1)
}

async function buildScope2Promise(
  scope2Payload: BodyEmissions['scope2'],
  dbEmissions: DefaultEmissions,
  baseMetadata: Partial<Metadata> | undefined,
  user: User,
  reportS3Url?: string | null
) {
  const existingScope2Id = dbEmissions.scope2?.id

  if (scope2Payload === null && existingScope2Id) {
    return emissionsService.deleteScope2(existingScope2Id)
  }

  if (scope2Payload === undefined || scope2Payload === null) {
    return false
  }

  const existing = existingScope2Id
    ? await prisma.scope2.findUnique({
        where: { id: existingScope2Id },
        select: { mb: true, lb: true, unknown: true, unit: true },
      })
    : null
  const next = stripProvenanceFields(scope2Payload) as Scope2UpsertInput
  const changed =
    existing &&
    (existing.mb !== (next.mb ?? null) ||
      existing.lb !== (next.lb ?? null) ||
      existing.unknown !== (next.unknown ?? null) ||
      existing.unit !== (next.unit ?? null))
  const previousValue = changed
    ? ({
        mb: existing.mb,
        lb: existing.lb,
        unknown: existing.unknown,
        unit: existing.unit,
      } satisfies Prisma.InputJsonValue)
    : undefined

  const metadataForScope2 = await createDatapointMetadata({
    baseMetadata,
    provenance: scope2Payload,
    user,
    verified: scope2Payload.verified ?? false,
    reportS3Url,
    previousValue,
  })

  return emissionsService.upsertScope2(dbEmissions, next, metadataForScope2)
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
            year: periodYear,
            companyReportId: periodCompanyReportId,
            reportURL,
            reportS3Url,
            reportSha256,
          }) => {
            const year = periodYear?.trim() || endDate.getFullYear().toString()

            const companyReportIdForPeriod =
              await companyReportService.companyReportIdForPeriodSave(
                company.id,
                resolvedCompanyReportId,
                periodCompanyReportId,
                documentReportYear,
                { explicitDocumentReportYear: bodyDocumentReportYear }
              )

            const createdMetadata = await metadataService.createMetadata({
              metadata,
              user,
              verified: false,
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

            const storagePdfUrl = reportS3Url ?? request.body.reportS3Url

            await Promise.allSettled([
              buildScope1Promise(
                scope1,
                dbEmissions,
                metadata,
                user,
                storagePdfUrl
              ),
              buildScope2Promise(
                scope2,
                dbEmissions,
                metadata,
                user,
                storagePdfUrl
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
                  (opts) =>
                    createDatapointMetadata({
                      baseMetadata: metadata,
                      provenance: opts,
                      user,
                      verified: opts.verified,
                      reportS3Url: storagePdfUrl,
                      previousValue: opts.previousValue,
                    })
                ),
              statedTotalEmissions !== undefined &&
                (async () => {
                  const existingId = dbEmissions.statedTotalEmissions?.id
                  const existing = existingId
                    ? await prisma.statedTotalEmissions.findUnique({
                        where: { id: existingId },
                        select: { total: true, unit: true },
                      })
                    : null
                  const next = stripProvenanceFields(
                    statedTotalEmissions!
                  ) as StatedTotalUpsertInput
                  const previousValue =
                    existing &&
                    (existing.total !== next.total || existing.unit !== next.unit)
                      ? ({
                          total: existing.total,
                          unit: existing.unit,
                        } satisfies Prisma.InputJsonValue)
                      : undefined
                  const metadataForStatedTotal = await createDatapointMetadata({
                    baseMetadata: metadata,
                    provenance: statedTotalEmissions ?? undefined,
                    user,
                    verified: statedTotalEmissions?.verified ?? false,
                    reportS3Url: storagePdfUrl,
                    previousValue,
                  })
                  return emissionsService.upsertStatedTotalEmissions(
                    dbEmissions,
                    metadataForStatedTotal,
                    next
                  )
                })(),
              biogenic !== undefined &&
                (async () => {
                  const existingId = dbEmissions.biogenicEmissions?.id
                  const existing = existingId
                    ? await prisma.biogenicEmissions.findUnique({
                        where: { id: existingId },
                        select: { total: true, unit: true },
                      })
                    : null
                  const next = stripProvenanceFields(
                    biogenic!
                  ) as BiogenicUpsertInput
                  const previousValue =
                    existing &&
                    (existing.total !== next.total || existing.unit !== next.unit)
                      ? ({
                          total: existing.total,
                          unit: existing.unit,
                        } satisfies Prisma.InputJsonValue)
                      : undefined
                  const metadataForBiogenic = await createDatapointMetadata({
                    baseMetadata: metadata,
                    provenance: biogenic ?? undefined,
                    user,
                    verified: biogenic?.verified ?? false,
                    reportS3Url: storagePdfUrl,
                    previousValue,
                  })
                  return emissionsService.upsertBiogenic(
                    dbEmissions,
                    next,
                    metadataForBiogenic
                  )
                })(),
              scope1And2 !== undefined &&
                (async () => {
                  const existingId = dbEmissions.scope1And2?.id
                  const existing = existingId
                    ? await prisma.scope1And2.findUnique({
                        where: { id: existingId },
                        select: { total: true, unit: true },
                      })
                    : null
                  const next = stripProvenanceFields(
                    scope1And2!
                  ) as Scope1And2UpsertInput
                  const previousValue =
                    existing &&
                    (existing.total !== next.total || existing.unit !== next.unit)
                      ? ({
                          total: existing.total,
                          unit: existing.unit,
                        } satisfies Prisma.InputJsonValue)
                      : undefined
                  const metadataForScope1And2 = await createDatapointMetadata({
                    baseMetadata: metadata,
                    provenance: scope1And2 ?? undefined,
                    user,
                    verified: scope1And2?.verified ?? false,
                    reportS3Url: storagePdfUrl,
                    previousValue,
                  })
                  return emissionsService.upsertScope1And2(
                    dbEmissions,
                    next,
                    metadataForScope1And2
                  )
                })(),
              turnover &&
                (async () => {
                  const existingId = dbEconomy.turnover?.id
                  const existing = existingId
                    ? await prisma.turnover.findUnique({
                        where: { id: existingId },
                        select: { value: true, currency: true },
                      })
                    : null
                  const next = _.omit(turnover, 'verified')
                  const previousValue =
                    existing &&
                    (existing.value !== next.value ||
                      existing.currency !== next.currency)
                      ? ({
                          value: existing.value,
                          currency: existing.currency,
                        } satisfies Prisma.InputJsonValue)
                      : undefined
                  const metadataForTurnover = await createDatapointMetadata({
                    baseMetadata: metadata,
                    user,
                    verified: turnover.verified ?? false,
                    reportS3Url: storagePdfUrl,
                    previousValue,
                  })
                  return companyService.upsertTurnover({
                    economy: dbEconomy,
                    metadata: metadataForTurnover,
                    turnover: next,
                  })
                })(),
              employees &&
                (async () => {
                  const existingId = dbEconomy.employees?.id
                  const existing = existingId
                    ? await prisma.employees.findUnique({
                        where: { id: existingId },
                        select: { value: true, unit: true },
                      })
                    : null
                  const next = _.omit(employees, 'verified')
                  const previousValue =
                    existing &&
                    (existing.value !== next.value || existing.unit !== next.unit)
                      ? ({
                          value: existing.value,
                          unit: existing.unit,
                        } satisfies Prisma.InputJsonValue)
                      : undefined
                  const metadataForEmployees = await createDatapointMetadata({
                    baseMetadata: metadata,
                    user,
                    verified: employees.verified ?? false,
                    reportS3Url: storagePdfUrl,
                    previousValue,
                  })
                  return companyService.upsertEmployees({
                    economy: dbEconomy,
                    employees: next,
                    metadata: metadataForEmployees,
                  })
                })(),
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
            documentReportYear: bodyDocumentReportYear,
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
