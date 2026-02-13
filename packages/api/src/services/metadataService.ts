import { Metadata, User } from '@prisma/client'
import { prisma } from '../../lib/prisma'

class MetadataService {
  async createMetadata({
    user,
    metadata,
    verified = false,
  }: {
    user: User
    metadata?: Partial<Metadata>
    verified?: boolean
  }) {
    return prisma.metadata.create({
      data: {
        comment: metadata?.comment,
        source: metadata?.source,
        user: {
          connect: {
            id: user.id,
          },
        },
        verifiedBy: verified
          ? {
              connect: {
                id: user.id,
              },
            }
          : undefined,
      },
    })
  }
}

export const metadataService = new MetadataService()
