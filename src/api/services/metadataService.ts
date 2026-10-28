import { Metadata, Prisma, User } from '@prisma/client'
import { prisma } from '../../lib/prisma'

class MetadataService {
  // TODO(Klimatbyran/garbo#1333): Callers should wrap createMetadata + datapoint writes in prisma.$transaction.
  async createMetadata({
    user,
    metadata,
    verified = false,
    previousValue,
  }: {
    user: User
    metadata?: Partial<Metadata>
    verified?: boolean
    /** Value before this change; stored on the new history link. */
    previousValue?: Prisma.InputJsonValue | null
  }) {
    return prisma.metadata.create({
      data: {
        comment: metadata?.comment,
        source: metadata?.source,
        sourceReference: metadata?.sourceReference,
        sourcePageUrl: metadata?.sourcePageUrl,
        previousValue:
          previousValue === undefined
            ? undefined
            : previousValue === null
              ? Prisma.JsonNull
              : previousValue,
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
