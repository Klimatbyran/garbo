import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
  registryDeleteRequestBodySchema,
  registryUpdateRequestBodySchema,
} from '../schemas'
import z from 'zod'
import {
  buildReportLookupOr,
  mergeNullReportFields,
  pickSurvivorReport,
  type RegistryReportIdentityRow,
  trimStr,
  isLikelyStoredObjectUrl,
} from './registryReportIdentity'

function promoteHumanUrlFromInput(
  existing: RegistryReportIdentityRow,
  inputUrl: string
): string | undefined {
  const inUrl = trimStr(inputUrl)
  const exUrl = trimStr(existing.url)
  if (!inUrl || !exUrl) return undefined
  if (
    isLikelyStoredObjectUrl(exUrl) &&
    !isLikelyStoredObjectUrl(inUrl) &&
    /^https?:\/\//i.test(inUrl)
  ) {
    return inUrl
  }
  return undefined
}

function buildSingleRowUpsertData(
  existing: RegistryReportIdentityRow,
  input: {
    companyName: string
    wikidataId?: string | null
    reportYear?: string | null
    url: string
    sourceUrl?: string | null
    s3Url?: string | null
    s3Key?: string | null
    s3Bucket?: string | null
    sha256?: string | null
  }
): Prisma.ReportUpdateInput {
  const promoted = promoteHumanUrlFromInput(existing, input.url)
  return {
    companyName: existing.companyName ?? input.companyName,
    wikidataId: existing.wikidataId ?? input.wikidataId ?? undefined,
    reportYear: existing.reportYear ?? input.reportYear ?? undefined,
    ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
    ...(input.s3Url !== undefined ? { s3Url: input.s3Url } : {}),
    ...(input.s3Key !== undefined ? { s3Key: input.s3Key } : {}),
    ...(input.s3Bucket !== undefined ? { s3Bucket: input.s3Bucket } : {}),
    ...(input.sha256 !== undefined ? { sha256: input.sha256 } : {}),
    ...(promoted !== undefined ? { url: promoted } : {}),
  }
}

/** After merging duplicate rows in-memory, persist union + apply input overlays. */
function buildMergedRowUpsertData(
  merged: RegistryReportIdentityRow,
  input: {
    companyName: string
    wikidataId?: string | null
    reportYear?: string | null
    url: string
    sourceUrl?: string | null
    s3Url?: string | null
    s3Key?: string | null
    s3Bucket?: string | null
    sha256?: string | null
  }
): Prisma.ReportUpdateInput {
  const promoted = promoteHumanUrlFromInput(merged, input.url)
  const baseUrl = trimStr(merged.url) || trimStr(input.url) || merged.url

  return {
    companyName: merged.companyName ?? input.companyName,
    wikidataId: merged.wikidataId ?? input.wikidataId ?? undefined,
    reportYear: merged.reportYear ?? input.reportYear ?? undefined,
    url: promoted ?? baseUrl,
    sourceUrl:
      input.sourceUrl !== undefined ? input.sourceUrl : merged.sourceUrl,
    s3Url: input.s3Url !== undefined ? input.s3Url : merged.s3Url,
    s3Key: input.s3Key !== undefined ? input.s3Key : merged.s3Key,
    s3Bucket: input.s3Bucket !== undefined ? input.s3Bucket : merged.s3Bucket,
    sha256: input.sha256 !== undefined ? input.sha256 : merged.sha256,
  }
}

class RegistryService {
  async getReportRegistry(prismaClient = prisma) {
    const registry = await prismaClient.report.findMany({
      orderBy: [{ reportYear: 'desc' }, { companyName: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        companyName: true,
        wikidataId: true,
        reportYear: true,
        url: true,
        sourceUrl: true,
        s3Url: true,
        s3Key: true,
        s3Bucket: true,
        sha256: true,
      },
    })
    return registry
  }

  async upsertReportInRegistry(
    input: {
      companyName: string
      wikidataId?: string | null
      reportYear?: string | null
      url: string
      sourceUrl?: string | null
      s3Url?: string | null
      s3Key?: string | null
      s3Bucket?: string | null
      sha256?: string | null
    },
    prismaClient = prisma
  ) {
    const or = buildReportLookupOr(input)
    const where: Prisma.ReportWhereInput =
      or.length > 0 ? { OR: or } : { url: input.url }

    const matches = await prismaClient.report.findMany({
      where,
      orderBy: { id: 'asc' },
    })

    if (matches.length === 0) {
      return prismaClient.report.create({
        data: {
          companyName: input.companyName,
          wikidataId: input.wikidataId ?? undefined,
          reportYear: input.reportYear ?? undefined,
          url: input.url,
          sourceUrl: input.sourceUrl ?? undefined,
          s3Url: input.s3Url ?? undefined,
          s3Key: input.s3Key ?? undefined,
          s3Bucket: input.s3Bucket ?? undefined,
          sha256: input.sha256 ?? undefined,
        },
      })
    }

    if (matches.length === 1) {
      const existing = matches[0]
      return prismaClient.report.update({
        where: { id: existing.id },
        data: buildSingleRowUpsertData(
          existing as RegistryReportIdentityRow,
          input
        ),
      })
    }

    return prismaClient.$transaction(async (tx) => {
      const refreshed = await tx.report.findMany({
        where: { id: { in: matches.map((m) => m.id) } },
        orderBy: { id: 'asc' },
      })
      const survivor = pickSurvivorReport(
        refreshed as RegistryReportIdentityRow[]
      )
      const losers = refreshed.filter((r) => r.id !== survivor.id)
      const merged: RegistryReportIdentityRow = { ...survivor }
      for (const row of losers) {
        Object.assign(
          merged,
          mergeNullReportFields(merged, row as RegistryReportIdentityRow)
        )
      }
      for (const row of losers) {
        await tx.report.delete({ where: { id: row.id } })
      }
      return tx.report.update({
        where: { id: survivor.id },
        data: buildMergedRowUpsertData(merged, input),
      })
    })
  }

  async updateReportInRegistry(
    data: z.infer<typeof registryUpdateRequestBodySchema>,
    prismaClient = prisma
  ) {
    const { id, ...fields } = data
    const report = await prismaClient.report.findUnique({ where: { id } })
    if (!report) return null
    return prismaClient.report.update({
      where: { id },
      data: fields,
    })
  }

  async deleteReportFromRegistry(
    reportsToDelete: z.infer<typeof registryDeleteRequestBodySchema>,
    prismaClient = prisma
  ) {
    const deletedReports: Array<{
      id: string
      companyName: string | null
      wikidataId: string | null
      reportYear: string | null
      url: string
    }> = []

    for (const { id } of reportsToDelete) {
      try {
        const deleted = await prismaClient.report.delete({
          where: { id },
        })
        deletedReports.push(deleted)
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          continue
        }
        throw error
      }
    }
    return deletedReports
  }
}

export const registryService = new RegistryService()
