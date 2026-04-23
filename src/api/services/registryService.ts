import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
  registryDeleteRequestBodySchema,
  registryUpdateRequestBodySchema,
} from '../schemas'
import z from 'zod'

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

  async upsertReportInRegistry(input: {
    companyName: string
    wikidataId?: string | null
    reportYear?: string | null
    url: string
    sourceUrl?: string | null
    s3Url?: string | null
    s3Key?: string | null
    s3Bucket?: string | null
    sha256?: string | null
  }, prismaClient = prisma) {
    const { sha256, sourceUrl, url } = input

    const existing =
      (typeof sha256 === 'string' && sha256
        ? await prismaClient.report.findUnique({ where: { sha256 } })
        : null) ||
      (typeof sourceUrl === 'string' && sourceUrl
        ? await prismaClient.report.findUnique({ where: { sourceUrl } })
        : null) ||
      (await prismaClient.report.findUnique({ where: { url } }))

    if (!existing) {
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

    return prismaClient.report.update({
      where: { id: existing.id },
      data: {
        companyName: existing.companyName ?? input.companyName,
        wikidataId: existing.wikidataId ?? input.wikidataId ?? undefined,
        reportYear: existing.reportYear ?? input.reportYear ?? undefined,
        sourceUrl: existing.sourceUrl ?? input.sourceUrl ?? undefined,
        s3Url: existing.s3Url ?? input.s3Url ?? undefined,
        s3Key: existing.s3Key ?? input.s3Key ?? undefined,
        s3Bucket: existing.s3Bucket ?? input.s3Bucket ?? undefined,
        sha256: existing.sha256 ?? input.sha256 ?? undefined,
      },
    })
  }

  async updateReportInRegistry(
    data: z.infer<typeof registryUpdateRequestBodySchema>
  ) {
    const { id, ...fields } = data
    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return null
    return prisma.report.update({
      where: { id },
      data: fields,
    })
  }

  async deleteReportFromRegistry(
    reportsToDelete: z.infer<typeof registryDeleteRequestBodySchema>
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
        const deleted = await prisma.report.delete({
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
