import { jest } from '@jest/globals'

const prismaMock = {
  user: {
    upsert: jest.fn<() => Promise<unknown>>(),
  },
  metadata: {
    create: jest.fn<() => Promise<unknown>>(),
  },
  companyIdentifier: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    upsert: jest.fn<() => Promise<unknown>>(),
  },
}

jest.unstable_mockModule('../src/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.unstable_mockModule('../src/api/services/serviceBotUser', () => ({
  GARBO_SERVICE_CLIENT_ID: 'garbo',
  getOrCreateServiceBotUser: jest.fn(async () => botUser),
}))

const { companyIdentifierService } = await import(
  '../src/api/services/companyIdentifierService'
)

const botUser = { id: 'user-garbo', name: 'garbo', bot: true }

describe('companyIdentifierService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('upsertIdentifier creates row and metadata for new identifier', async () => {
    prismaMock.companyIdentifier.findUnique.mockResolvedValue(null)
    prismaMock.metadata.create.mockResolvedValue({ id: 'meta-1' })
    prismaMock.companyIdentifier.upsert.mockResolvedValue({
      id: 'id-1',
      type: 'WIKIDATA',
      value: 'Q123',
    })

    await companyIdentifierService.upsertIdentifier({
      companyId: 'company-1',
      type: 'WIKIDATA',
      value: 'Q123',
      user: botUser as any,
      metadata: { source: 'test' },
    })

    expect(prismaMock.metadata.create).toHaveBeenCalled()
    expect(prismaMock.companyIdentifier.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId_type: { companyId: 'company-1', type: 'WIKIDATA' } },
        create: expect.objectContaining({ value: 'Q123' }),
      })
    )
  })

  it('upsertIdentifier skips metadata when value unchanged and skipMetadataIfUnchanged is set', async () => {
    prismaMock.companyIdentifier.findUnique.mockResolvedValue({
      id: 'id-1',
      value: 'Q123',
    })

    const result = await companyIdentifierService.upsertIdentifier({
      companyId: 'company-1',
      type: 'WIKIDATA',
      value: 'Q123',
      user: botUser as any,
      skipMetadataIfUnchanged: true,
    })

    expect(result).toEqual({ id: 'id-1', value: 'Q123' })
    expect(prismaMock.metadata.create).not.toHaveBeenCalled()
    expect(prismaMock.companyIdentifier.upsert).not.toHaveBeenCalled()
  })

  it('syncFromLegacyColumns upserts wikidata and lei from company columns', async () => {
    prismaMock.companyIdentifier.findUnique.mockResolvedValue(null)
    prismaMock.metadata.create.mockResolvedValue({ id: 'meta-1' })
    prismaMock.companyIdentifier.upsert.mockResolvedValue({ id: 'id-1' })

    await companyIdentifierService.syncFromLegacyColumns(
      {
        id: 'company-1',
        wikidataId: 'Q99',
        lei: 'LEI123',
      },
      { user: botUser as any, source: 'migration-backfill' }
    )

    expect(prismaMock.companyIdentifier.upsert).toHaveBeenCalledTimes(2)
  })
})
