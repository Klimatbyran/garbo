import { Company, Metadata } from '@prisma/client'
import { prisma } from '../..'

class IndustryService {
  async createIndustry(
    wikidataId: Company['wikidataId'],
    industry: { subIndustryCode: string },
    metadata: Metadata
  ) {
    return prisma.industry.create({
      data: {
        company: {
          connect: { wikidataId },
        },
        industryGics: {
          connect: {
            subIndustryCode: industry.subIndustryCode,
          },
        },
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      select: { id: true },
    })
  }

  async updateIndustry(
    wikidataId: Company['wikidataId'],
    industry: { subIndustryCode: string },
    metadata: Metadata
  ) {
    return prisma.industry.update({
      where: { companyWikidataId: wikidataId },
      data: {
        industryGics: {
          connect: {
            subIndustryCode: industry.subIndustryCode,
          },
        },
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      select: { id: true },
    })
  }
}

export const industryService = new IndustryService()
