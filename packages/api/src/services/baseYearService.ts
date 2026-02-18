import { Company, BaseYear, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { PostBaseYearBody } from '../types'
import { companyService } from './companyService'

class BaseYearService {
  async upsertBaseYear(
    wikidataId: Company['wikidataId'],
    baseYear: PostBaseYearBody['baseYear'],
    metadata: Metadata
  ) {
    const existingBaseYearId = (await companyService.getCompany(wikidataId))
      .baseYear?.id

    return prisma.baseYear.upsert({
      where: { id: existingBaseYearId ?? '' },
      create: {
        year: baseYear,
        metadata: {
          connect: { id: metadata.id },
        },
        company: {
          connect: {
            wikidataId,
          },
        },
      },
      update: {
        year: baseYear,
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      select: { id: true },
    })
  }

  async deleteBaseYear(id: BaseYear['id']) {
    return prisma.baseYear.delete({ where: { id } })
  }
}
export const baseYearService = new BaseYearService()
