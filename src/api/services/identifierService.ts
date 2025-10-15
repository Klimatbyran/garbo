import { Company, CompanyIdentifier, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { metadataArgs } from '../args'

class IdentifierService {
  async upsertIdentifier(
    companyId: string,
    type: string,
    value: string,
    metadata: Metadata,
  ) {
    return prisma.companyIdentifier.upsert({
      where: {
        companyId_type: { companyId, type },
      },
      create: {
        companyId,
        type,
        value,
        metadataId: metadata.id,
      },
      update: {
        value,
        metadataId: metadata.id,
      },
      include: {
        metadata: metadataArgs,
      },
    })
  }

  async updateIdentifier(
    companyId: string,
    type: string,
    value: string,
    metadata: Metadata,
  ) {
    return prisma.companyIdentifier.update({
      where: {
        companyId_type: { companyId, type },
      },
      data: {
        value,
        metadataId: metadata.id,
      },
      include: {
        metadata: metadataArgs,
      },
    })
  }
}

export const identifierService = new IdentifierService()
