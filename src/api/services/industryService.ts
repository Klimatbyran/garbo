import { prisma } from '../../lib/prisma'
import { Metadata } from '@prisma/client'

class IndustryService {
  async upsertIndustry(
    companyId: string,
    industry: { subIndustryCode: string },
    metadata: Metadata
  ) {
    return prisma.industry.upsert({
      where: { companyId },
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
          connect: { id: companyId },
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

  async deleteIndustry(companyId: string) {
    return await prisma.industry.findFirstOrThrow({
      where: { companyId },
    })
  }
}

export const industryService = new IndustryService()
