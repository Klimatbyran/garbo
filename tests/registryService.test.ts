import { jest } from '@jest/globals'
import { registryService } from '../src/api/services/registryService'

// Keep this as `any` so TS doesn't infer `jest.fn()` as `never`.
const mockPrisma: any = {
  report: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
}

describe('registryService', () => {
  jest.setTimeout(20_000)

  beforeEach(() => {
    mockPrisma.report.findMany.mockReset()
    mockPrisma.report.create.mockReset()
    mockPrisma.report.update.mockReset()
    mockPrisma.report.delete.mockReset()
    mockPrisma.$transaction.mockReset()
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) =>
      fn(mockPrisma)
    )
  })

  it('getReportRegistry selects new S3/source fields', async () => {
    mockPrisma.report.findMany.mockResolvedValueOnce([])
    await registryService.getReportRegistry(mockPrisma)

    expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          sourceUrl: true,
          s3Url: true,
          s3Key: true,
          s3Bucket: true,
          sha256: true,
        }),
      })
    )
  })

  it('upserts by OR match (sha256) and fills missing fields only', async () => {
    const existing = {
      id: 'r1',
      url: 'https://example.com/report.pdf',
      companyName: 'Acme',
      wikidataId: null,
      reportYear: null,
      sourceUrl: null,
      s3Url: null,
      s3Key: null,
      s3Bucket: null,
      sha256: 'a'.repeat(64),
    }

    mockPrisma.report.findMany.mockResolvedValueOnce([existing])
    mockPrisma.report.update.mockResolvedValueOnce({
      ...existing,
      sourceUrl: 'https://source.example/report.pdf',
      s3Url: 'https://cdn.example/uploads/prod/abc.pdf',
    })

    await registryService.upsertReportInRegistry(
      {
        companyName: 'NewNameIgnored',
        wikidataId: 'Q1',
        reportYear: '2024',
        url: 'https://example.com/report.pdf',
        sourceUrl: 'https://source.example/report.pdf',
        s3Url: 'https://cdn.example/uploads/prod/abc.pdf',
        sha256: 'a'.repeat(64),
      },
      mockPrisma
    )

    expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ sha256: 'a'.repeat(64) }]),
        }),
      })
    )

    expect(mockPrisma.report.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({
        companyName: 'Acme',
        wikidataId: 'Q1',
        reportYear: '2024',
        sourceUrl: 'https://source.example/report.pdf',
        s3Url: 'https://cdn.example/uploads/prod/abc.pdf',
      }),
    })
  })

  it('creates when no OR matches', async () => {
    mockPrisma.report.findMany.mockResolvedValueOnce([])

    mockPrisma.report.create.mockResolvedValueOnce({
      id: 'new',
      companyName: 'Acme',
      wikidataId: 'Q2',
      reportYear: '2023',
      url: 'https://example.com/r.pdf',
    })

    await registryService.upsertReportInRegistry(
      {
        companyName: 'Acme',
        wikidataId: 'Q2',
        reportYear: '2023',
        url: 'https://example.com/r.pdf',
        sourceUrl: 'https://source.example/r.pdf',
        s3Url: 'https://cdn.example/uploads/prod/r.pdf',
      },
      mockPrisma
    )

    expect(mockPrisma.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        url: 'https://example.com/r.pdf',
        sourceUrl: 'https://source.example/r.pdf',
        s3Url: 'https://cdn.example/uploads/prod/r.pdf',
      }),
    })
  })

  it('upsert update clears sourceUrl/s3Url when input passes null', async () => {
    const existing = {
      id: 'r1',
      url: 'https://example.com/a.pdf',
      companyName: 'Acme',
      wikidataId: 'Q1',
      reportYear: '2024',
      sourceUrl: 'https://source.example/old',
      s3Url: 'https://cdn.example/old.pdf',
      s3Key: 'k1',
      s3Bucket: 'b1',
      sha256: null as string | null,
    }

    mockPrisma.report.findMany.mockResolvedValueOnce([existing])

    mockPrisma.report.update.mockResolvedValueOnce({
      ...existing,
      sourceUrl: null,
      s3Url: null,
    })

    await registryService.upsertReportInRegistry(
      {
        companyName: 'Acme',
        wikidataId: 'Q1',
        reportYear: '2024',
        url: 'https://example.com/a.pdf',
        sourceUrl: null,
        s3Url: null,
      },
      mockPrisma
    )

    expect(mockPrisma.report.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({
        sourceUrl: null,
        s3Url: null,
      }),
    })
  })

  it('merges multiple matching rows in a transaction', async () => {
    const s3 = 'https://bucket.s3.amazonaws.com/x.pdf'
    const rowA = {
      id: 'a',
      url: 'https://corp.example/2024/esg',
      companyName: 'Corp',
      wikidataId: 'Q9',
      reportYear: '2024',
      sourceUrl: null,
      s3Url: s3,
      s3Key: null,
      s3Bucket: null,
      sha256: null as string | null,
    }
    const rowB = {
      id: 'b',
      url: s3,
      companyName: null,
      wikidataId: null,
      reportYear: null,
      sourceUrl: 'https://source.example/page',
      s3Url: s3,
      s3Key: 'key1',
      s3Bucket: 'bkt',
      sha256: 'b'.repeat(64),
    }

    mockPrisma.report.findMany
      .mockResolvedValueOnce([rowA, rowB])
      .mockResolvedValueOnce([rowA, rowB])

    mockPrisma.report.delete.mockResolvedValue({})
    mockPrisma.report.update.mockResolvedValue({ ...rowB, ...rowA })

    await registryService.upsertReportInRegistry(
      {
        companyName: 'Ignored',
        wikidataId: 'Q9',
        reportYear: '2024',
        url: 'https://corp.example/2024/esg',
        sourceUrl: undefined,
        s3Url: s3,
        sha256: 'b'.repeat(64),
      },
      mockPrisma
    )

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(mockPrisma.report.delete).toHaveBeenCalledWith({ where: { id: 'a' } })
    expect(mockPrisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'b' },
        data: expect.objectContaining({
          url: 'https://corp.example/2024/esg',
          sourceUrl: 'https://source.example/page',
          s3Url: s3,
          s3Key: 'key1',
          s3Bucket: 'bkt',
          sha256: 'b'.repeat(64),
        }),
      })
    )
  })
})
