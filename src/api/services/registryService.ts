import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
  registryDeleteRequestBodySchema,
  registryUpdateRequestBodySchema,
} from '../schemas'
import z from 'zod'

class RegistryService {
  async getReportRegistry() {
    const registry = await prisma.report.findMany({
      orderBy: [{ reportYear: 'desc' }, { companyName: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        companyName: true,
        wikidataId: true,
        reportYear: true,
        url: true,
      },
    })
    return registry
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
