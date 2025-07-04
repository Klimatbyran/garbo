import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { issueSchema, nextStepSchema, assessmentSchema, assessmentResultSchema } from './schema'


export const companyWithEmissionsInclude = {
  reportingPeriods: {
    include: {
      emissions: {
        include: {
          scope1: true,
          scope2: true,
          scope3: {
            include: {
              categories: true,
              statedTotalEmissions: true
            }
          },
          biogenicEmissions: true
        }
      }
    }
  },
  industry: {
    include: {
      industryGics: true
    }
  }
} satisfies Prisma.CompanyInclude

export type CompanyWithEmissions = Prisma.CompanyGetPayload<{
  include: typeof companyWithEmissionsInclude
}>

// Data types used in assessment
export type ReportingPeriodData = Pick<CompanyWithEmissions['reportingPeriods'][0], 'year' | 'reportURL' | 'emissions'>
export type IndustryData = CompanyWithEmissions['industry']

// Assessment types
export type AssessmentInput = {
  url: string
  companyName: string
  existingCompany: {
    name: string
    wikidataId: string
    industry?: IndustryData
  }
  wikidata: { node: string }
  reportingPeriods: ReportingPeriodData[]
  industry?: IndustryData
}


export type Issue = z.infer<typeof issueSchema>
export type NextStep = z.infer<typeof nextStepSchema>
export type Assessment = z.infer<typeof assessmentSchema>
export type AssessmentResult = z.infer<typeof assessmentResultSchema>


export interface ValidationResult {
  valid: boolean
  message: string
} 