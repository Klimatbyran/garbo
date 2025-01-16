import { Company, Initiative, Metadata, Prisma } from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { prisma } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'

class InitiativeService {
  async createInitiatives(
    wikidataId: Company['wikidataId'],
    initiatives: OptionalNullable<
      Omit<Initiative, 'metadataId' | 'companyId' | 'id'>
    >[],
    createMetadata: () => Promise<Metadata>
  ) {
    return await Promise.all(
      initiatives.map(async (initiative) => {
        const metadata = await createMetadata()
        return prisma.initiative.create({
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
      })
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
    try {
      return await prisma.initiative.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Initiative not found', { statusCode: 404 })
      }
      throw error
    }
  }
}

export const initiativeService = new InitiativeService()
