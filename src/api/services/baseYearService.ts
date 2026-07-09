import { BaseYear, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { PostBaseYearBody } from '../types'
import { companyService } from './companyService'

class BaseYearService {
  async upsertBaseYear(
    companyId: string,
    baseYear: PostBaseYearBody['baseYear'],
    metadata: Metadata
  ) {
    const existingBaseYearId = (
      await companyService.getCompanyByInternalId(companyId)
    ).baseYear?.id

    return prisma.baseYear.upsert({
      where: { id: existingBaseYearId ?? '' },
      create: {
        year: baseYear,
        metadata: {
          connect: { id: metadata.id },
        },
        company: {
          connect: {
            id: companyId,
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
