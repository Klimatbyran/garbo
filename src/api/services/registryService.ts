import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
  registryDeleteRequestBodySchema,
  registryUpdateRequestBodySchema,
} from '../schemas'
import z from 'zod'
import {
  buildReportMatchConditions,
  copyMissingFields,
  pickRowToKeep,
  type RegistryReportIdentityRow,
  trimStr,
  isStorageUrl,
} from './registryReportIdentity'

type ReportInput = {
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

// When the stored url is a storage.googleapis.com link but we now have a proper web URL,
// return the web URL — human-readable links are better for our frontend users.
function findWebUrlUpgrade(
  existing: RegistryReportIdentityRow,
  inputUrl: string
): string | undefined {
  const storedUrl = trimStr(existing.url)
  const incomingUrl = trimStr(inputUrl)

  if (!storedUrl || !incomingUrl) return undefined

  const storedIsStorageLink = isStorageUrl(storedUrl)
  const incomingIsWebUrl =
    !isStorageUrl(incomingUrl) && /^https?:\/\//i.test(incomingUrl)

  if (storedIsStorageLink && incomingIsWebUrl) return incomingUrl

  return undefined
}

function patchRow(
  existing: RegistryReportIdentityRow,
  input: ReportInput
): Prisma.ReportUpdateInput {
  const update: Prisma.ReportUpdateInput = {
    companyName: existing.companyName ?? input.companyName,
    wikidataId: existing.wikidataId ?? input.wikidataId ?? undefined,
    reportYear: existing.reportYear ?? input.reportYear ?? undefined,
  }

  // Only assign when explicitly provided — omitting keeps Prisma from clearing the field.
  if (input.sourceUrl !== undefined) update.sourceUrl = input.sourceUrl
  if (input.s3Url !== undefined) update.s3Url = input.s3Url
  if (input.s3Key !== undefined) update.s3Key = input.s3Key
  if (input.s3Bucket !== undefined) update.s3Bucket = input.s3Bucket
  if (input.sha256 !== undefined) update.sha256 = input.sha256

  const webUrl = findWebUrlUpgrade(existing, input.url)
  if (webUrl) update.url = webUrl

  return update
}

function applyMergedRows(
  merged: RegistryReportIdentityRow,
  input: ReportInput
): Prisma.ReportUpdateInput {
  const baseUrl = trimStr(merged.url) || trimStr(input.url) || merged.url
  const webUrl = findWebUrlUpgrade(merged, input.url)

  return {
    companyName: merged.companyName ?? input.companyName,
    wikidataId: merged.wikidataId ?? input.wikidataId ?? undefined,
    reportYear: merged.reportYear ?? input.reportYear ?? undefined,
    url: webUrl ?? baseUrl,
    sourceUrl: input.sourceUrl !== undefined ? input.sourceUrl : merged.sourceUrl,
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

  async upsertReportInRegistry(input: ReportInput, prismaClient = prisma) {
    const lookupConditions = buildReportMatchConditions(input)
    const where: Prisma.ReportWhereInput =
      lookupConditions.length > 0 ? { OR: lookupConditions } : { url: input.url }

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
        data: patchRow(existing as RegistryReportIdentityRow, input),
      })
    }

    // Multiple matches: the same document was indexed more than once under different URLs.
    // Collapse them into one row inside a transaction.
    return prismaClient.$transaction(async (tx) => {
      const rows = await tx.report.findMany({
        where: { id: { in: matches.map((m) => m.id) } },
        orderBy: { id: 'asc' },
      })

      const rowToKeep = pickRowToKeep(rows as RegistryReportIdentityRow[])
      const rowsToDelete = rows.filter((r) => r.id !== rowToKeep.id)

      const mergedRow: RegistryReportIdentityRow = { ...rowToKeep }
      for (const row of rowsToDelete) {
        Object.assign(mergedRow, copyMissingFields(mergedRow, row as RegistryReportIdentityRow))
      }

      for (const row of rowsToDelete) {
        await tx.report.delete({ where: { id: row.id } })
      }
      return tx.report.update({
        where: { id: rowToKeep.id },
        data: applyMergedRows(mergedRow, input),
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
