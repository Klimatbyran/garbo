import { Company, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'

class IndustryService {
  async upsertIndustry(
    wikidataId: Company['wikidataId'],
    industry: { subIndustryCode: string },
    metadata: Metadata
  ) {
    return prisma.industry.upsert({
      where: { companyWikidataId: wikidataId },
      update: {
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
      create: {
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

  async deleteIndustry(wikidataId: string) {
    return await prisma.industry.findFirstOrThrow({
      where: { companyWikidataId: wikidataId },
    })
  }
}

export const industryService = new IndustryService()
