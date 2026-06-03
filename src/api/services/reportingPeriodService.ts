import { Company } from '@prisma/client'

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
      reportS3Url,
      reportSha256,
      year,
      companyReportId,
    }: {
      startDate: Date
      endDate: Date
      reportURL?: string | null
      reportS3Url?: string | null
      reportSha256?: string | null
      year: string
      companyReportId: string
    }
  ) {
    return prisma.reportingPeriod.upsert({
      where: {
        companyReportId_year: {
          companyReportId,
          year,
        },
      },
      update: {
        startDate,
        endDate,
        reportURL,
        reportS3Url,
        reportSha256,
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
        reportS3Url,
        reportSha256,
        year,
        companyId: company.wikidataId,
        companyReportId,
        company: {
          connect: {
            wikidataId: company.wikidataId,
          },
        },
        companyReport: {
          connect: {
            id: companyReportId,
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

  async deleteReportingPeriod(id: string) {
    return await prisma.reportingPeriod.delete({ where: { id } })
  }
}

export const reportingPeriodService = new ReportingPeriodService()
