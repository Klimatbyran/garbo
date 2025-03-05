import { Metadata, User } from '@prisma/client'

import { prisma } from '../../lib/prisma'
import apiConfig from '../../config/api'

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
    // TODO: Find a better way to determine if changes by the current user should count as verified or not
    // IDEA: Maybe a column in the User table to determine if this is a trusted editor? And if so, all their changes are automatically "verified".
    const verifiedByUserEmail =
      user.email === apiConfig.authorizedUsers.alex
        ? apiConfig.authorizedUsers.alex
        : null

    return prisma.metadata.create({
      data: {
        comment: metadata?.comment,
        source: metadata?.source,
        user: {
          connect: {
            id: user.id,
          },
        },
        verifiedBy: verifiedByUserEmail && verified
          ? {
              connect: {
                email: verifiedByUserEmail,
              },
            }
          : undefined,
      },
    })
  }
}

export const metadataService = new MetadataService()
