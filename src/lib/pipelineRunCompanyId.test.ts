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

const getJobsMock = jest.fn<() => Promise<unknown[]>>()
const closeMock = jest.fn<() => Promise<void>>()
const getSharedQueueMock = jest.fn(() => ({
  getJobs: getJobsMock,
  close: closeMock,
}))

jest.unstable_mockModule('./prisma', () => ({
  prisma: prismaMock,
}))

jest.unstable_mockModule('./getSharedQueue', () => ({
  getSharedQueue: getSharedQueueMock,
}))

let getCanonicalCompanyIdForThread: typeof import('./pipelineRunCompanyId').getCanonicalCompanyIdForThread
let syncCanonicalReportRunCompanyId: typeof import('./pipelineRunCompanyId').syncCanonicalReportRunCompanyId
let wikidataNodeFromConfirmedGuessJob: typeof import('./pipelineRunCompanyId').wikidataNodeFromConfirmedGuessJob
let isCompanyLinkResolutionPendingForThread: typeof import('./pipelineRunCompanyId').isCompanyLinkResolutionPendingForThread

beforeAll(async () => {
  ;({
    getCanonicalCompanyIdForThread,
    syncCanonicalReportRunCompanyId,
    wikidataNodeFromConfirmedGuessJob,
    isCompanyLinkResolutionPendingForThread,
  } = await import('./pipelineRunCompanyId'))
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

  it('ignores rejected suggested Q-id when staff approved no Wikidata', () => {
    expect(
      wikidataNodeFromConfirmedGuessJob(
        { wikidata: { node: 'Q999' } },
        {
          type: 'wikidata',
          approved: true,
          data: {
            newValue: {
              noWikidata: true,
              wikidata: { node: 'Q123' },
            },
          },
        }
      )
    ).toBeUndefined()
  })

  it('returns approved Wikidata Q-id when noWikidata is not set', () => {
    expect(
      wikidataNodeFromConfirmedGuessJob(
        {},
        {
          type: 'wikidata',
          approved: true,
          data: { newValue: { wikidata: { node: 'Q123' } } },
        }
      )
    ).toBe('Q123')
  })

  it('treats delayed companyLink guessWikidata jobs as pending without closing the shared queue', async () => {
    const getState = jest.fn(async () => 'delayed')
    const otherThreadGetState = jest.fn(async () => 'delayed')
    getJobsMock.mockResolvedValue([
      {
        data: {
          threadId: 'thread-1',
          approval: { type: 'companyLink', approved: false },
        },
        getState,
      },
      {
        data: { threadId: 'other-thread' },
        getState: otherThreadGetState,
      },
    ])

    await expect(
      isCompanyLinkResolutionPendingForThread('thread-1')
    ).resolves.toBe(true)

    expect(getSharedQueueMock).toHaveBeenCalledWith('guessWikidata')
    expect(getState).toHaveBeenCalledTimes(1)
    expect(otherThreadGetState).not.toHaveBeenCalled()
    expect(closeMock).not.toHaveBeenCalled()
  })

  it('ignores terminal companyLink guessWikidata jobs', async () => {
    getJobsMock.mockResolvedValue([
      {
        data: {
          threadId: 'thread-1',
          approval: { type: 'companyLink', approved: false },
        },
        getState: jest.fn(async () => 'completed'),
      },
    ])

    await expect(
      isCompanyLinkResolutionPendingForThread('thread-1')
    ).resolves.toBe(false)
    expect(closeMock).not.toHaveBeenCalled()
  })
})
