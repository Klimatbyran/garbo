import { Prisma } from '@prisma/client'
import { registryService } from '../src/api/services/registryService'
import { jest } from '@jest/globals'

const p2025Error = new Prisma.PrismaClientKnownRequestError(
  'Record not found',
  {
    code: 'P2025',
    clientVersion: '5.0.0',
  }
)

const p1001Error = new Prisma.PrismaClientKnownRequestError(
  'Connection refused',
  {
    code: 'P1001',
    clientVersion: '5.0.0',
  }
)

const sampleReport = {
  id: 'cmnh123',
  companyName: 'Volvo',
  wikidataId: null,
  reportYear: '2024',
  url: 'https://example.com/volvo.pdf',
  sourceUrl: null,
  s3Url: null,
  s3Key: null,
  s3Bucket: null,
  sha256: null,
}

// Keep this as `any` so TS doesn't infer `jest.fn()` as `never`.
const mockPrisma: any = {
  report: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

let mockFindMany: any
let mockFindUnique: any
let mockUpdate: any
let mockDelete: any

beforeEach(() => {
  mockFindMany = mockPrisma.report.findMany
  mockFindUnique = mockPrisma.report.findUnique
  mockUpdate = mockPrisma.report.update
  mockDelete = mockPrisma.report.delete

  mockFindMany.mockReset()
  mockFindUnique.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('getReportRegistry', () => {
  test('returns all reports from prisma with the correct select and order', async () => {
    mockFindMany.mockResolvedValue([sampleReport])

    const result = await registryService.getReportRegistry(mockPrisma)

    expect(result).toEqual([sampleReport])
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: [{ reportYear: 'desc' }, { companyName: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        companyName: true,
        wikidataId: true,
        reportYear: true,
        url: true,
        sourceUrl: true,
        s3Url: true,
        s3Key: true,
        s3Bucket: true,
        sha256: true,
      },
    })
  })

  test('returns an empty array when there are no reports', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await registryService.getReportRegistry(mockPrisma)

    expect(result).toEqual([])
  })
})

describe('updateReportInRegistry', () => {
  test('returns null and skips update when report is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await registryService.updateReportInRegistry(
      {
        id: 'nonexistent',
        companyName: 'Test Corp',
      },
      mockPrisma
    )

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('calls prisma update with only the provided fields (excluding id)', async () => {
    mockFindUnique.mockResolvedValue(sampleReport)
    mockUpdate.mockResolvedValue({ ...sampleReport, companyName: 'New Name' })

    await registryService.updateReportInRegistry(
      {
        id: 'cmnh123',
        companyName: 'New Name',
      },
      mockPrisma
    )

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'cmnh123' },
      data: { companyName: 'New Name' },
    })
  })

  test('does not pass id as a data field to update', async () => {
    mockFindUnique.mockResolvedValue(sampleReport)
    mockUpdate.mockResolvedValue(sampleReport)

    await registryService.updateReportInRegistry(
      {
        id: 'cmnh123',
        reportYear: '2025',
      },
      mockPrisma
    )

    const updateCall = mockUpdate.mock.calls[0][0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data).not.toHaveProperty('id')
    expect(updateCall.data).toEqual({ reportYear: '2025' })
  })

  test('returns the updated report from prisma', async () => {
    const updated = { ...sampleReport, url: 'https://example.com/new.pdf' }
    mockFindUnique.mockResolvedValue(sampleReport)
    mockUpdate.mockResolvedValue(updated)

    const result = await registryService.updateReportInRegistry(
      {
        id: 'cmnh123',
        url: 'https://example.com/new.pdf',
      },
      mockPrisma
    )

    expect(result).toEqual(updated)
  })
})

describe('deleteReportFromRegistry', () => {
  test('deletes a report and returns it', async () => {
    mockDelete.mockResolvedValue(sampleReport)

    const result = await registryService.deleteReportFromRegistry(
      [{ id: 'cmnh123' }],
      mockPrisma
    )

    expect(result).toEqual([sampleReport])
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'cmnh123' } })
  })

  test('returns an empty array when the report is not found (P2025)', async () => {
    mockDelete.mockRejectedValue(p2025Error)

    const result = await registryService.deleteReportFromRegistry(
      [{ id: 'nonexistent' }],
      mockPrisma
    )

    expect(result).toEqual([])
  })

  test('rethrows errors that are not P2025', async () => {
    mockDelete.mockRejectedValue(p1001Error)

    await expect(
      registryService.deleteReportFromRegistry([{ id: 'cmnh123' }], mockPrisma)
    ).rejects.toThrow(p1001Error)
  })

  test('returns only the successfully deleted reports in a batch', async () => {
    mockDelete
      .mockResolvedValueOnce(sampleReport)
      .mockRejectedValueOnce(p2025Error)

    const result = await registryService.deleteReportFromRegistry(
      [{ id: 'cmnh123' }, { id: 'missing' }],
      mockPrisma
    )

    expect(result).toEqual([sampleReport])
  })

  test('returns an empty array when given an empty list', async () => {
    const result = await registryService.deleteReportFromRegistry(
      [],
      mockPrisma
    )

    expect(result).toEqual([])
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
