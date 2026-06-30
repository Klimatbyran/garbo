import { CompanyIdentifierType, User } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import {
  GARBO_SERVICE_CLIENT_ID,
  getOrCreateServiceBotUser,
} from './serviceBotUser'

class CompanyIdentifierService {
  async upsertIdentifier({
    companyId,
    type,
    value,
    user,
    metadata,
    verified = false,
    skipMetadataIfUnchanged = false,
  }: {
    companyId: string
    type: CompanyIdentifierType
    value: string
    user: User
    metadata?: { source?: string; comment?: string }
    verified?: boolean
    skipMetadataIfUnchanged?: boolean
  }): Promise<{ id: string; value: string } | null> {
    const trimmedValue = value.trim()
    if (!trimmedValue) return null

    const existing = await prisma.companyIdentifier.findUnique({
      where: {
        companyId_type: { companyId, type },
      },
      select: { id: true, value: true },
    })

    if (existing?.value === trimmedValue && skipMetadataIfUnchanged) {
      return existing
    }

    return prisma.$transaction(async (transaction) => {
      const metadataRecord = await transaction.metadata.create({
        data: {
          comment: metadata?.comment,
          source: metadata?.source,
          user: { connect: { id: user.id } },
          verifiedBy: verified ? { connect: { id: user.id } } : undefined,
        },
      })

      return transaction.companyIdentifier.upsert({
        where: {
          companyId_type: { companyId, type },
        },
        create: {
          companyId,
          type,
          value: trimmedValue,
          metadata: { connect: { id: metadataRecord.id } },
        },
        update: {
          value: trimmedValue,
          metadata: { connect: { id: metadataRecord.id } },
        },
      })
    })
  }

  async syncFromLegacyColumns(
    company: { id: string; wikidataId: string; lei?: string | null },
    options?: {
      user?: User
      source?: string
      verified?: boolean
    }
  ) {
    const user =
      options?.user ??
      (await getOrCreateServiceBotUser(GARBO_SERVICE_CLIENT_ID))
    const source = options?.source ?? 'company-column-sync'

    const synced: Array<{ id: string; value?: string }> = []

    if (company.wikidataId.trim()) {
      const row = await this.upsertIdentifier({
        companyId: company.id,
        type: 'WIKIDATA',
        value: company.wikidataId,
        user,
        metadata: {
          source,
          comment: 'Synced from Company.wikidataId',
        },
        verified: options?.verified ?? false,
        skipMetadataIfUnchanged: true,
      })
      if (row) synced.push(row)
    }

    const lei = company.lei?.trim()
    if (lei) {
      const row = await this.upsertIdentifier({
        companyId: company.id,
        type: 'LEI',
        value: lei,
        user,
        metadata: {
          source,
          comment: 'Synced from Company.lei',
        },
        verified: options?.verified ?? false,
        skipMetadataIfUnchanged: true,
      })
      if (row) synced.push(row)
    }

    return synced
  }
}

export const companyIdentifierService = new CompanyIdentifierService()
