import {
  CompanyIdentifierRole,
  CompanyIdentifierType,
  User,
} from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { requireNormalizedIsin } from '../../lib/normalizeIsin'
import { requireNormalizedBic } from '../../lib/normalizeBic'
import { normalizeLei, requireNormalizedLei } from '../../lib/normalizeLei'
import {
  GARBO_SERVICE_CLIENT_ID,
  getOrCreateServiceBotUser,
} from './serviceBotUser'

const SINGULAR_TYPES = new Set<CompanyIdentifierType>([
  'WIKIDATA',
  'LEI',
  'ORG_NUMBER',
])

const CASE_INSENSITIVE_TYPES = new Set<CompanyIdentifierType>([
  'ISIN',
  'LEI',
  'BIC',
])

function persistIdentifierValue(
  type: CompanyIdentifierType,
  value: string
): string {
  if (type === 'LEI') return requireNormalizedLei(value)
  if (type === 'ISIN') return requireNormalizedIsin(value)
  if (type === 'BIC') return requireNormalizedBic(value)
  return value.trim()
}

function isOwnershipConflict(error: unknown): boolean {
  return (error as { code?: number }).code === 409
}

class CompanyIdentifierService {
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

  async assertValueNotOwnedByOtherCompany(
    companyId: string,
    type: CompanyIdentifierType,
    value: string
  ): Promise<void> {
    const other = await prisma.companyIdentifier.findFirst({
      where: {
        type,
        ...(CASE_INSENSITIVE_TYPES.has(type)
          ? { value: { equals: value, mode: 'insensitive' as const } }
          : { value }),
        NOT: { companyId },
      },
      select: { companyId: true },
    })
    if (other) {
      throw Object.assign(
        new Error(
          `${type} value ${value} is already in use by company ${other.companyId}`
        ),
        { code: 409 }
      )
    }

    if (type === 'LEI') {
      const byColumn = await prisma.company.findFirst({
        where: {
          lei: { equals: value, mode: 'insensitive' },
          NOT: { id: companyId },
        },
        select: { id: true },
      })
      if (byColumn) {
        throw Object.assign(
          new Error(`LEI ${value} is already in use by company ${byColumn.id}`),
          { code: 409 }
        )
      }
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
    role,
    createOnly = false,
    onOwnershipConflict = 'throw',
  }: {
    companyId: string
    type: CompanyIdentifierType
    value: string
    user: User
    metadata?: { source?: string; comment?: string }
    verified?: boolean
    skipMetadataIfUnchanged?: boolean
    role?: CompanyIdentifierRole | null
    /** When true, leave an existing singular-type row unchanged. */
    createOnly?: boolean
    onOwnershipConflict?: 'throw' | 'skip'
  }): Promise<{
    id: string
    value: string
    role: CompanyIdentifierRole | null
  } | null> {
    const trimmedValue = value.trim()
    if (!trimmedValue) return null

    const persistedValue = persistIdentifierValue(type, trimmedValue)

    try {
      await this.assertValueNotOwnedByOtherCompany(
        companyId,
        type,
        persistedValue
      )
    } catch (error) {
      if (onOwnershipConflict === 'skip' && isOwnershipConflict(error)) {
        return null
      }
      throw error
    }

    const singular = SINGULAR_TYPES.has(type)
    const existing = singular
      ? await prisma.companyIdentifier.findFirst({
          where: { companyId, type },
          select: { id: true, value: true, role: true },
        })
      : await prisma.companyIdentifier.findFirst({
          where: {
            companyId,
            type,
            ...(CASE_INSENSITIVE_TYPES.has(type)
              ? {
                  value: {
                    equals: persistedValue,
                    mode: 'insensitive' as const,
                  },
                }
              : { value: persistedValue }),
          },
          select: { id: true, value: true, role: true },
        })

    if (createOnly && existing) {
      // Do not treat a blocked overwrite as a successful write.
      if (existing.value !== persistedValue) return null
      return existing
    }

    if (
      existing &&
      existing.value === persistedValue &&
      (role === undefined || existing.role === role) &&
      skipMetadataIfUnchanged
    ) {
      return existing
    }

    try {
      return await prisma.$transaction(async (transaction) => {
        if (role === 'PRIMARY') {
          await transaction.companyIdentifier.updateMany({
            where: {
              companyId,
              type,
              role: 'PRIMARY',
              ...(existing ? { NOT: { id: existing.id } } : {}),
            },
            data: { role: null },
          })
        }

        const metadataRecord = await transaction.metadata.create({
          data: {
            comment: metadata?.comment,
            source: metadata?.source,
            user: { connect: { id: user.id } },
            verifiedBy: verified ? { connect: { id: user.id } } : undefined,
          },
        })

        if (existing) {
          return transaction.companyIdentifier.update({
            where: { id: existing.id },
            data: {
              value: persistedValue,
              ...(role !== undefined ? { role } : {}),
              metadata: { connect: { id: metadataRecord.id } },
            },
          })
        }

        return transaction.companyIdentifier.create({
          data: {
            companyId,
            type,
            value: persistedValue,
            role: role ?? null,
            metadata: { connect: { id: metadataRecord.id } },
          },
        })
      })
    } catch (error) {
      // Concurrent PRIMARY / singular unique races surface as P2002.
      if ((error as { code?: string }).code === 'P2002') {
        if (onOwnershipConflict === 'skip') return null
        throw Object.assign(
          new Error(
            `${type} value ${persistedValue} conflicts with an existing identifier`
          ),
          { code: 409 }
        )
      }
      throw error
    }
  }

  async upsertMany({
    companyId,
    items,
    user,
    metadata,
    verified = false,
    createOnlyTypes,
    onOwnershipConflict = 'skip',
  }: {
    companyId: string
    items: Array<{
      type: CompanyIdentifierType
      value: string
      role?: CompanyIdentifierRole | null
    }>
    user: User
    metadata?: { source?: string; comment?: string }
    verified?: boolean
    createOnlyTypes?: Iterable<CompanyIdentifierType>
    onOwnershipConflict?: 'throw' | 'skip'
  }) {
    const createOnly = new Set(createOnlyTypes ?? [])
    const results: Array<{
      id: string
      value: string
      role: CompanyIdentifierRole | null
    }> = []
    const skipped: Array<{ type: CompanyIdentifierType; value: string }> = []

    for (const item of items) {
      const row = await this.upsertIdentifier({
        companyId,
        type: item.type,
        value: item.value,
        role: item.role,
        user,
        metadata,
        verified,
        skipMetadataIfUnchanged: true,
        createOnly: createOnly.has(item.type),
        onOwnershipConflict,
      })
      if (row) {
        results.push(row)
      } else {
        skipped.push({ type: item.type, value: item.value })
      }
    }
    return { results, skipped }
  }

  async syncFromLegacyColumns(
    company: { id: string; wikidataId: string | null; lei?: string | null },
    options?: {
      user?: User
      source?: string
      verified?: boolean
      syncWikidata?: boolean
      syncLei?: boolean
      wikidataMetadata?: { source?: string; comment?: string }
      leiMetadata?: { source?: string; comment?: string }
    }
  ) {
    const syncWikidata = options?.syncWikidata ?? true
    const syncLei = options?.syncLei ?? true
    const user =
      options?.user ??
      (await getOrCreateServiceBotUser(GARBO_SERVICE_CLIENT_ID))
    const defaultSource = options?.source ?? 'company-column-sync'

    const synced: Array<{ id: string; value: string }> = []

    if (syncWikidata && company.wikidataId?.trim()) {
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
      if (row) synced.push({ id: row.id, value: row.value })
    }

    const lei = normalizeLei(company.lei)
    if (syncLei && lei) {
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
      if (row) synced.push({ id: row.id, value: row.value })
    }

    return synced
  }

  async deleteIdentifier(
    companyId: string,
    type: CompanyIdentifierType
  ): Promise<boolean> {
    const result = await prisma.companyIdentifier.deleteMany({
      where: { companyId, type },
    })
    return result.count > 0
  }

  async deleteIdentifierValue(
    companyId: string,
    type: CompanyIdentifierType,
    value: string
  ): Promise<boolean> {
    const persistedValue = persistIdentifierValue(type, value)
    const result = await prisma.companyIdentifier.deleteMany({
      where: {
        companyId,
        type,
        ...(CASE_INSENSITIVE_TYPES.has(type)
          ? {
              value: {
                equals: persistedValue,
                mode: 'insensitive' as const,
              },
            }
          : { value: persistedValue }),
      },
    })
    return result.count > 0
  }
}

export const companyIdentifierService = new CompanyIdentifierService()
