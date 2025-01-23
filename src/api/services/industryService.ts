import { Company, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'

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

  async deleteIndustry(wikidataId: string) {
    return await prisma.industry.findFirstOrThrow({
      where: { companyWikidataId: wikidataId },
    })
  }
}

export const industryService = new IndustryService()
