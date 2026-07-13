import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} from '@jest/globals'

const prismaMock = {
  reportRun: {
    findUnique: jest.fn<() => Promise<{ companyId: string | null } | null>>(),
    upsert: jest.fn<() => Promise<unknown>>(),
    updateMany: jest.fn<() => Promise<unknown>>(),
  },
}

jest.unstable_mockModule('./prisma', () => ({
  prisma: prismaMock,
}))

let getCanonicalCompanyIdForThread: typeof import('./pipelineRunCompanyId').getCanonicalCompanyIdForThread
let syncCanonicalReportRunCompanyId: typeof import('./pipelineRunCompanyId').syncCanonicalReportRunCompanyId

beforeAll(async () => {
  ;({ getCanonicalCompanyIdForThread, syncCanonicalReportRunCompanyId } =
    await import('./pipelineRunCompanyId'))
})

describe('pipelineRunCompanyId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('prefers ReportRun.companyId over job data', async () => {
    prismaMock.reportRun.findUnique.mockResolvedValue({
      companyId: 'canonical-id',
    })

    const result = await getCanonicalCompanyIdForThread(
      'thread-1',
      'stale-job-id'
    )
    expect(result).toEqual({
      companyId: 'canonical-id',
      source: 'report_run',
    })
  })

  it('falls back to job data when ReportRun has no companyId', async () => {
    prismaMock.reportRun.findUnique.mockResolvedValue({ companyId: null })

    const result = await getCanonicalCompanyIdForThread('thread-1', 'job-id')
    expect(result).toEqual({
      companyId: 'job-id',
      source: 'job_data',
    })
  })

  it('upserts ReportRun when pdfUrl is available', async () => {
    await syncCanonicalReportRunCompanyId({
      threadId: 'thread-1',
      companyId: 'company-1',
      pdfUrl: 'https://example.com/report.pdf',
      companyName: 'Alfa Laval',
      wikidataId: 'Q686030',
    })

    expect(prismaMock.reportRun.upsert).toHaveBeenCalledWith({
      where: { threadId: 'thread-1' },
      create: {
        threadId: 'thread-1',
        pdfUrl: 'https://example.com/report.pdf',
        companyId: 'company-1',
        companyName: 'Alfa Laval',
        wikidataId: 'Q686030',
      },
      update: {
        companyId: 'company-1',
        companyName: 'Alfa Laval',
        wikidataId: 'Q686030',
      },
    })
  })

  it('updates existing ReportRun when pdfUrl is missing', async () => {
    await syncCanonicalReportRunCompanyId({
      threadId: 'thread-1',
      companyId: 'company-1',
      companyName: 'Alfa Laval',
    })

    expect(prismaMock.reportRun.updateMany).toHaveBeenCalledWith({
      where: { threadId: 'thread-1' },
      data: {
        companyId: 'company-1',
        companyName: 'Alfa Laval',
        wikidataId: undefined,
      },
    })
    expect(prismaMock.reportRun.upsert).not.toHaveBeenCalled()
  })
})
