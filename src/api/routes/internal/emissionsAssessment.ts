import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type {
  ReportingPeriodData,
  CompanyWithEmissions,
} from '@/jobs/emissions/types'
import { companyWithEmissionsInclude } from '@/jobs/emissions/types'
import {
  assessmentResultSchema,
  errorResponseSchema,
} from '@/jobs/emissions/schema'
import { assessEmissions } from '@/jobs/emissions/assess'

const emissionsAssessmentSchema = z.object({
  wikidataId: z.string(),
  years: z.array(z.string()),
})

const getCompanyEmissionsDataFromDatabase = async (
  wikidataId: string,
  years: string[]
): Promise<CompanyWithEmissions | null> => {
  const sortedYears = [...years].sort()

  return prisma.company.findUnique({
    where: { wikidataId },
    include: {
      ...companyWithEmissionsInclude,
      reportingPeriods: {
        ...companyWithEmissionsInclude.reportingPeriods,
        where: { year: { in: sortedYears } },
        orderBy: { year: 'asc' },
      },
    },
  })
}

const companyIsValid = (
  company: CompanyWithEmissions
): { valid: boolean; message: string } => {
  if (company.reportingPeriods.length === 0) {
    return {
      valid: false,
      message: 'No reporting periods found for the specified years',
    }
  }

  const mostRecentPeriod =
    company.reportingPeriods[company.reportingPeriods.length - 1]
  if (!mostRecentPeriod.reportURL) {
    return {
      valid: false,
      message: 'No report URL found for the most recent reporting period',
    }
  }

  return {
    valid: true,
    message: 'Assessment request valid',
  }
}

type EmissionsAssessmentRequest = z.infer<typeof emissionsAssessmentSchema>

export async function emissionsAssessmentRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        body: emissionsAssessmentSchema,
        response: {
          200: assessmentResultSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { wikidataId, years } = request.body as EmissionsAssessmentRequest

        const company = await getCompanyEmissionsDataFromDatabase(
          wikidataId,
          years
        )

        if (!company) {
          return reply.status(400).send({
            code: '400',
            message: 'Company not found',
          })
        }

        const { valid, message } = companyIsValid(company)
        if (!valid) {
          return reply.status(400).send({
            code: '400',
            message: message,
          })
        }

        const reportingPeriods =
          company.reportingPeriods as ReportingPeriodData[]
        const mostRecentPeriod =
          company.reportingPeriods[company.reportingPeriods.length - 1]

        const result = await assessEmissions({
          url: mostRecentPeriod.reportURL as string,
          companyName: company.name,
          existingCompany: {
            name: company.name,
            wikidataId: company.wikidataId,
            industry: company.industry ?? undefined,
          },
          wikidata: { node: company.wikidataId },
          reportingPeriods,
          industry: company.industry ?? undefined,
        })

        return result
      } catch (error) {
        console.error('Error in emissions assessment:', error)
        return reply.status(500).send({
          code: '500',
          message: 'Internal server error during emissions assessment',
        })
      }
    },
  )
}
