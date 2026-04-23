import { jest } from '@jest/globals'
import { registryService } from '../src/api/services/registryService'

// Keep this as `any` so TS doesn't infer `jest.fn()` as `never`.
const mockPrisma: any = {
  report: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

describe('registryService', () => {
  jest.setTimeout(20_000)

  beforeEach(() => {
    mockPrisma.report.findMany.mockReset()
    mockPrisma.report.findUnique.mockReset()
    mockPrisma.report.create.mockReset()
    mockPrisma.report.update.mockReset()
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

  it('upserts by sha256 first and fills missing fields only', async () => {
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

    mockPrisma.report.findUnique
      .mockResolvedValueOnce(existing) // sha256 lookup
      .mockResolvedValueOnce(null) // sourceUrl lookup would be skipped (short-circuit)
      .mockResolvedValueOnce(null) // url lookup would be skipped (short-circuit)

    mockPrisma.report.update.mockResolvedValueOnce({
      ...existing,
      sourceUrl: 'https://source.example/report.pdf',
      s3Url: 'https://cdn.example/uploads/prod/abc.pdf',
    })

    await registryService.upsertReportInRegistry({
      companyName: 'NewNameIgnored',
      wikidataId: 'Q1',
      reportYear: '2024',
      url: 'https://example.com/report.pdf',
      sourceUrl: 'https://source.example/report.pdf',
      s3Url: 'https://cdn.example/uploads/prod/abc.pdf',
      sha256: 'a'.repeat(64),
    }, mockPrisma)

    expect(mockPrisma.report.findUnique).toHaveBeenCalledWith({
      where: { sha256: 'a'.repeat(64) },
    })

    expect(mockPrisma.report.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({
        // existing companyName is not overwritten
        companyName: 'Acme',
        // missing fields get filled
        wikidataId: 'Q1',
        reportYear: '2024',
        sourceUrl: 'https://source.example/report.pdf',
        s3Url: 'https://cdn.example/uploads/prod/abc.pdf',
      }),
    })
  })

  it('falls back to upsert by sourceUrl, then by url, then creates', async () => {
    mockPrisma.report.findUnique
      .mockResolvedValueOnce(null) // sha256 lookup
      .mockResolvedValueOnce(null) // sourceUrl lookup
      .mockResolvedValueOnce(null) // url lookup

    mockPrisma.report.create.mockResolvedValueOnce({
      id: 'new',
      companyName: 'Acme',
      wikidataId: 'Q2',
      reportYear: '2023',
      url: 'https://example.com/r.pdf',
    })

    await registryService.upsertReportInRegistry({
      companyName: 'Acme',
      wikidataId: 'Q2',
      reportYear: '2023',
      url: 'https://example.com/r.pdf',
      sourceUrl: 'https://source.example/r.pdf',
      s3Url: 'https://cdn.example/uploads/prod/r.pdf',
    }, mockPrisma)

    expect(mockPrisma.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        url: 'https://example.com/r.pdf',
        sourceUrl: 'https://source.example/r.pdf',
        s3Url: 'https://cdn.example/uploads/prod/r.pdf',
      }),
    })
  })
})

