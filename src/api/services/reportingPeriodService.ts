import { Company } from '@prisma/client'
import { reportingPeriodArgs } from '../types'
import { prisma } from '../..'

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
    }
  ) {
    const reportingPeriod = await prisma.reportingPeriod.findFirst({
      where: {
        companyId: company.wikidataId,
        year,
      },
    })

    return prisma.reportingPeriod.upsert({
      where: {
        id: reportingPeriod?.id ?? 0,
      },
      update: {},
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

  async updateReportingPeriodReportURL(
    company: Company,
    year: string,
    reportURL: string
  ) {
    const reportingPeriod = await prisma.reportingPeriod.findFirst({
      where: {
        companyId: company.wikidataId,
        year,
      },
    })

    if (!reportingPeriod) {
      return false
    }

    return prisma.reportingPeriod.update({
      where: {
        id: reportingPeriod.id,
      },
      data: {
        reportURL,
      },
    })
  }
}

export const reportingPeriodService = new ReportingPeriodService()
