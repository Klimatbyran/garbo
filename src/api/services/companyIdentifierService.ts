import { CompanyIdentifierType, User } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { normalizeLei, requireNormalizedLei } from '../../lib/normalizeLei'
import {
  GARBO_SERVICE_CLIENT_ID,
  getOrCreateServiceBotUser,
} from './serviceBotUser'

class CompanyIdentifierService {
  /**
   * Returns another company's id if it already owns this LEI (column or identifier row).
   * Matches case-insensitively so mixed-case legacy rows still conflict.
   */
  async findOtherCompanyOwningLei(
    lei: string,
    excludeCompanyId?: string | null
  ): Promise<string | null> {
    const normalized = normalizeLei(lei)
    if (!normalized) return null

    const byColumn = await prisma.company.findFirst({
      where: {
        lei: { equals: normalized, mode: 'insensitive' },
        ...(excludeCompanyId ? { NOT: { id: excludeCompanyId } } : {}),
      },
      select: { id: true },
    })
    if (byColumn) return byColumn.id

    const byIdentifier = await prisma.companyIdentifier.findFirst({
      where: {
        type: 'LEI',
        value: { equals: normalized, mode: 'insensitive' },
        ...(excludeCompanyId ? { NOT: { companyId: excludeCompanyId } } : {}),
      },
      select: { companyId: true },
    })
    return byIdentifier?.companyId ?? null
  }

  async assertLeiNotOwnedByOtherCompany(
    companyId: string | null | undefined,
    lei: string
  ): Promise<void> {
    const normalized = normalizeLei(lei)
    if (!normalized) return

    const ownerId = await this.findOtherCompanyOwningLei(
      normalized,
      companyId ?? null
    )
    if (ownerId) {
      throw Object.assign(
        new Error(`LEI ${normalized} is already in use by company ${ownerId}`),
        { code: 409 }
      )
    }
  }

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

    const persistedValue =
      type === 'LEI' ? requireNormalizedLei(trimmedValue) : trimmedValue

    if (type === 'LEI') {
      await this.assertLeiNotOwnedByOtherCompany(companyId, persistedValue)
    }

    const existing = await prisma.companyIdentifier.findUnique({
      where: {
        companyId_type: { companyId, type },
      },
      select: { id: true, value: true },
    })

    if (existing?.value === persistedValue && skipMetadataIfUnchanged) {
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
          value: persistedValue,
          metadata: { connect: { id: metadataRecord.id } },
        },
        update: {
          value: persistedValue,
          metadata: { connect: { id: metadataRecord.id } },
        },
      })
    })
  }

  async syncFromLegacyColumns(
    company: { id: string; wikidataId: string | null; lei?: string | null },
    options?: {
      user?: User
      source?: string
      verified?: boolean
      wikidataMetadata?: { source?: string; comment?: string }
      leiMetadata?: { source?: string; comment?: string }
    }
  ) {
    const user =
      options?.user ??
      (await getOrCreateServiceBotUser(GARBO_SERVICE_CLIENT_ID))
    const defaultSource = options?.source ?? 'company-column-sync'

    const synced: Array<{ id: string; value?: string }> = []

    if (company.wikidataId?.trim()) {
      const row = await this.upsertIdentifier({
        companyId: company.id,
        type: 'WIKIDATA',
        value: company.wikidataId,
        user,
        metadata: {
          source: options?.wikidataMetadata?.source ?? defaultSource,
          comment:
            options?.wikidataMetadata?.comment ??
            'Synced from Company.wikidataId',
        },
        verified: options?.verified ?? false,
        skipMetadataIfUnchanged: true,
      })
      if (row) synced.push(row)
    }

    const lei = normalizeLei(company.lei)
    if (lei) {
      const row = await this.upsertIdentifier({
        companyId: company.id,
        type: 'LEI',
        value: lei,
        user,
        metadata: {
          source: options?.leiMetadata?.source ?? defaultSource,
          comment: options?.leiMetadata?.comment ?? 'Synced from Company.lei',
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
