import { Company, Initiative, Metadata } from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { prisma } from '../..'

class InitiativeService {
  async createInitiatives(
    wikidataId: Company['wikidataId'],
    initiatives: OptionalNullable<
      Omit<Initiative, 'metadataId' | 'companyId' | 'id'>
    >[],
    metadata: Metadata
  ) {
    return prisma.$transaction(
      initiatives.map((initiative) =>
        prisma.initiative.create({
          data: {
            ...initiative,
            title: initiative.title,
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
      )
    )
  }

  async updateInitiative(
    id: Initiative['id'],
    initiative: OptionalNullable<
      Omit<Initiative, 'metadataId' | 'companyId' | 'id'>
    >,
    metadata: Metadata
  ) {
    return prisma.initiative.update({
      where: { id },
      data: {
        ...initiative,
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      select: { id: true },
    })
  }

  async deleteInitiative(id: Initiative['id']) {
    return prisma.initiative.delete({ where: { id } })
  }
}

export const initiativeService = new InitiativeService()
