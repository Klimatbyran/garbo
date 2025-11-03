import { Company, ReportingPeriod } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { reportingPeriodArgs } from '../args'

class ReportingPeriodService {
  async upsertReportingPeriod(
    company: Company,
    metadata: Parameters<typeof prisma.metadata.create>[0]['data'],
    {
      startDate,
      endDate,
      reportURL,
      year,
    }: {
      startDate: Date
      endDate: Date
      reportURL?: string
      year: string
    },
  ) {
    return prisma.reportingPeriod.upsert({
      where: {
        companyId_year: {
          companyId: company.wikidataId,
          year,
        },
      },
      update: {
        startDate,
        endDate,
        reportURL,
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      create: {
        startDate,
        endDate,
        reportURL,
        year,
        company: {
          connect: {
            wikidataId: company.wikidataId,
          },
        },
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      ...reportingPeriodArgs,
    })
  }

  async deleteReportingPeriod(id: ReportingPeriod['id']) {
    return await prisma.reportingPeriod.delete({ where: { id } })
  }
}

export const reportingPeriodService = new ReportingPeriodService()
