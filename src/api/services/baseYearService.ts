import { Company, BaseYear, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { PostBaseYearBody } from '../types'

class BaseYearService {
  async createBaseYear(
    wikidataId: Company['wikidataId'],
    baseYear: PostBaseYearBody['baseYear'],
    createMetadata: () => Promise<Metadata>
  ) {
    const metadata = await createMetadata()
    return prisma.baseYear.create({
      data: {
        year: baseYear,
        company: {
          connect: {
            wikidataId,
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

  async updateBaseYear(
    id: BaseYear['id'],
    baseYear: PostBaseYearBody,
    metadata: Metadata
  ) {
    return prisma.baseYear.update({
      where: { id },
      data: {
        year: baseYear.baseYear,
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
