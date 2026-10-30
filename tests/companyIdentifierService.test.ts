import { jest } from '@jest/globals'

const prismaMock = {
  user: {
    upsert: jest.fn<() => Promise<unknown>>(),
  },
  metadata: {
    create: jest.fn<() => Promise<unknown>>(),
  },
  company: {
    findFirst: jest.fn<() => Promise<unknown>>(),
  },
  companyIdentifier: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    findFirst: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    updateMany: jest.fn<() => Promise<unknown>>(),
    deleteMany: jest.fn<() => Promise<{ count: number }>>(),
  },
  $transaction: jest.fn(
    async (callback: (client: typeof prismaMock) => Promise<unknown>) =>
      callback(prismaMock)
  ),
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
const VALID_LEI = '5493001KJTIIGC8Y1R12'

describe('companyIdentifierService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.company.findFirst.mockResolvedValue(null)
    prismaMock.companyIdentifier.findFirst.mockResolvedValue(null)
    prismaMock.companyIdentifier.findUnique.mockResolvedValue(null)
    prismaMock.companyIdentifier.updateMany.mockResolvedValue({ count: 0 })
  })

  it('upsertIdentifier creates row and metadata for new identifier', async () => {
    prismaMock.metadata.create.mockResolvedValue({ id: 'meta-1' })
    prismaMock.companyIdentifier.create.mockResolvedValue({
      id: 'id-1',
      type: 'WIKIDATA',
      value: 'Q123',
      role: null,
    })

    await companyIdentifierService.upsertIdentifier({
      companyId: 'company-1',
      type: 'WIKIDATA',
      value: 'Q123',
      user: botUser as any,
      metadata: { source: 'test' },
    })

    expect(prismaMock.metadata.create).toHaveBeenCalled()
    expect(prismaMock.$transaction).toHaveBeenCalled()
    expect(prismaMock.companyIdentifier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ value: 'Q123', type: 'WIKIDATA' }),
      })
    )
  })

  it('upsertIdentifier skips metadata when value unchanged and skipMetadataIfUnchanged is set', async () => {
    prismaMock.companyIdentifier.findFirst
      .mockResolvedValueOnce(null) // ownership conflict check
      .mockResolvedValueOnce({
        id: 'id-1',
        value: 'Q123',
        role: null,
      })

    const result = await companyIdentifierService.upsertIdentifier({
      companyId: 'company-1',
      type: 'WIKIDATA',
      value: 'Q123',
      user: botUser as any,
      skipMetadataIfUnchanged: true,
    })

    expect(result).toEqual({ id: 'id-1', value: 'Q123', role: null })
    expect(prismaMock.metadata.create).not.toHaveBeenCalled()
    expect(prismaMock.companyIdentifier.create).not.toHaveBeenCalled()
  })

  it('syncFromLegacyColumns upserts wikidata and lei from company columns', async () => {
    prismaMock.metadata.create.mockResolvedValue({ id: 'meta-1' })
    prismaMock.companyIdentifier.create.mockResolvedValue({
      id: 'id-1',
      role: null,
      value: 'x',
    })

    await companyIdentifierService.syncFromLegacyColumns(
      {
        id: 'company-1',
        wikidataId: 'Q99',
        lei: VALID_LEI,
      },
      { user: botUser as any, source: 'migration-backfill' }
    )

    expect(prismaMock.companyIdentifier.create).toHaveBeenCalledTimes(2)
  })

  it('syncFromLegacyColumns skips lei when syncLei is false', async () => {
    prismaMock.metadata.create.mockResolvedValue({ id: 'meta-1' })
    prismaMock.companyIdentifier.create.mockResolvedValue({
      id: 'id-1',
      role: null,
      value: 'Q99',
    })

    await companyIdentifierService.syncFromLegacyColumns(
      {
        id: 'company-1',
        wikidataId: 'Q99',
        lei: VALID_LEI,
      },
      { user: botUser as any, source: 'migration-backfill', syncLei: false }
    )

    expect(prismaMock.companyIdentifier.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.companyIdentifier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'WIKIDATA', value: 'Q99' }),
      })
    )
  })

  it('deleteIdentifier removes rows when present', async () => {
    prismaMock.companyIdentifier.deleteMany.mockResolvedValue({ count: 1 })

    const deleted = await companyIdentifierService.deleteIdentifier(
      'company-1',
      'LEI'
    )

    expect(deleted).toBe(true)
    expect(prismaMock.companyIdentifier.deleteMany).toHaveBeenCalledWith({
      where: { companyId: 'company-1', type: 'LEI' },
    })
  })

  it('deleteIdentifier returns false when row is missing', async () => {
    prismaMock.companyIdentifier.deleteMany.mockResolvedValue({ count: 0 })

    const deleted = await companyIdentifierService.deleteIdentifier(
      'company-1',
      'LEI'
    )

    expect(deleted).toBe(false)
  })
})
