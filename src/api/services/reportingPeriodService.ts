import { Company, Prisma, ReportingPeriod } from '@prisma/client'
import { reportingPeriodArgs } from '../types'
import { prisma } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'

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
        id: reportingPeriod?.id ?? '',
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

  async deleteReportingPeriod(id: ReportingPeriod['id']) {
    try {
      return await prisma.reportingPeriod.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('ReportingPeriod not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }
}

export const reportingPeriodService = new ReportingPeriodService()
