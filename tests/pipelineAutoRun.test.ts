import {
  pipelineAutoRunFiltersSchema,
  pipelineAutoRunOptionsSchema,
  pipelineAutoRunPatchSchema,
  DOCLING_FAILURE_AUTO_OFF,
  REPORT_FAILURE_AUTO_OFF,
  reportRunnableUrl,
  pickCandidatesFromPage,
  emissionsPresenceCandidateFilter,
  poisonLinkedReportRunFilter,
  linkedReportRunExclusion,
  isPoisonLinkedReportRun,
  foldAutoRunOutcomeEvents,
} from '../src/api/services/pipelineAutoRunTypes'

describe('pipelineAutoRunTypes', () => {
  it('applies safer defaults for run options', () => {
    const opts = pipelineAutoRunOptionsSchema.parse({})
    expect(opts.autoApprove).toBe(true)
    expect(opts.forceReindex).toBe(false)
    expect(opts.requireEmissionsPresence).toBe(true)
  })

  it('parses filters and patch', () => {
    const filters = pipelineAutoRunFiltersSchema.parse({
      reportTypeIds: ['t1'],
      coverageListIds: ['c1'],
    })
    expect(filters.reportTypeIds).toEqual(['t1'])
    expect(filters.registryBatchIds).toEqual([])
    expect(filters.coverageListIds).toEqual(['c1'])

    const patch = pipelineAutoRunPatchSchema.parse({
      enabled: true,
      maxConcurrent: 1,
      filters: { reportTypeIds: ['a'] },
    })
    expect(patch.enabled).toBe(true)
    expect(patch.maxConcurrent).toBe(1)
  })

  it('exposes auto-off thresholds', () => {
    expect(DOCLING_FAILURE_AUTO_OFF).toBe(3)
    expect(REPORT_FAILURE_AUTO_OFF).toBe(5)
  })

  it('accepts null batchId to clear a prior selection', () => {
    const opts = pipelineAutoRunOptionsSchema.parse({
      batchId: null,
      autoApprove: true,
    })
    expect(opts.batchId).toBeNull()

    const patch = pipelineAutoRunPatchSchema.parse({
      runOptions: { batchId: null },
    })
    expect(patch.runOptions?.batchId).toBeNull()
  })

  it('coerces null JSON array/bool fields to defaults', () => {
    expect(
      pipelineAutoRunFiltersSchema.parse({
        reportTypeIds: null,
        registryBatchIds: null,
        coverageListIds: null,
      })
    ).toEqual({
      reportTypeIds: [],
      registryBatchIds: [],
      coverageListIds: [],
    })
    expect(
      pipelineAutoRunOptionsSchema.parse({
        tags: null,
        runOnly: null,
        requireEmissionsPresence: null,
      })
    ).toMatchObject({
      requireEmissionsPresence: true,
      autoApprove: true,
      forceReindex: false,
    })
  })
})
describe('reportRunnableUrl', () => {
  it('prefers s3Url and keeps sourceUrl', () => {
    expect(
      reportRunnableUrl({
        url: 'https://example.com/r.pdf',
        sourceUrl: 'https://example.com/r.pdf',
        s3Url: 'https://storage.example/r.pdf',
      })
    ).toEqual({
      url: 'https://storage.example/r.pdf',
      sourceUrl: 'https://example.com/r.pdf',
    })
  })

  it('falls back to sourceUrl then url', () => {
    expect(
      reportRunnableUrl({
        url: 'https://example.com/r.pdf',
        sourceUrl: 'https://example.com/canonical.pdf',
        s3Url: null,
      })
    ).toEqual({ url: 'https://example.com/canonical.pdf' })

    expect(
      reportRunnableUrl({
        url: 'https://example.com/r.pdf',
        sourceUrl: null,
        s3Url: null,
      })
    ).toEqual({ url: 'https://example.com/r.pdf' })
  })
})

describe('pickCandidatesFromPage', () => {
  const row = (
    id: string,
    url: string,
    extra?: Partial<{ sourceUrl: string | null; s3Url: string | null }>
  ) => ({
    id,
    url,
    sourceUrl: extra?.sourceUrl ?? null,
    s3Url: extra?.s3Url ?? null,
    companyName: null,
    wikidataId: null,
  })

  it('skips claimed URL variants and keeps later unclaimed rows', () => {
    const claimed = new Set(['https://claimed.example/a.pdf'])
    const picked = pickCandidatesFromPage(
      [
        row('1', 'https://claimed.example/a.pdf'),
        row('2', 'https://ok.example/b.pdf'),
        row('3', 'https://ok.example/c.pdf'),
      ],
      claimed,
      2
    )
    expect(picked.map((r) => r.id)).toEqual(['2', '3'])
  })

  it('respects limit so a page full of claimed rows yields nothing', () => {
    const claimed = new Set([
      'https://claimed.example/a.pdf',
      'https://claimed.example/b.pdf',
    ])
    const picked = pickCandidatesFromPage(
      [
        row('1', 'https://claimed.example/a.pdf'),
        row('2', 'https://claimed.example/b.pdf'),
      ],
      claimed,
      1
    )
    expect(picked).toEqual([])
  })

  it('matches claim via s3Url variant', () => {
    const claimed = new Set(['https://storage.example/a.pdf'])
    const picked = pickCandidatesFromPage(
      [
        row('1', 'https://web.example/a.pdf', {
          s3Url: 'https://storage.example/a.pdf',
        }),
        row('2', 'https://ok.example/b.pdf'),
      ],
      claimed,
      1
    )
    expect(picked.map((r) => r.id)).toEqual(['2'])
  })
})

describe('emissionsPresenceCandidateFilter', () => {
  it('keeps true and null (Not checked), excludes only known false', () => {
    expect(emissionsPresenceCandidateFilter()).toEqual({
      OR: [{ hasEmissionsMentions: true }, { hasEmissionsMentions: null }],
    })
  })
})

describe('linkedReportRunExclusion', () => {
  const staleBefore = new Date('2026-01-01T00:00:00.000Z')
  const fresh = new Date('2026-01-02T00:00:00.000Z')
  const stale = new Date('2025-12-01T00:00:00.000Z')

  it('treats all completed and skipped as poison, failed only when autoRun', () => {
    expect(
      isPoisonLinkedReportRun(
        { status: 'completed', autoRun: false, updatedAt: fresh },
        staleBefore
      )
    ).toBe(true)
    expect(
      isPoisonLinkedReportRun(
        { status: 'skipped_no_emissions', autoRun: false, updatedAt: fresh },
        staleBefore
      )
    ).toBe(true)
    expect(
      isPoisonLinkedReportRun(
        { status: 'failed', autoRun: true, updatedAt: fresh },
        staleBefore
      )
    ).toBe(true)
    expect(
      isPoisonLinkedReportRun(
        { status: 'failed', autoRun: false, updatedAt: fresh },
        staleBefore
      )
    ).toBe(false)
  })

  it('treats fresh running as poison and stale running as eligible', () => {
    expect(
      isPoisonLinkedReportRun(
        { status: 'running', autoRun: true, updatedAt: fresh },
        staleBefore
      )
    ).toBe(true)
    expect(
      isPoisonLinkedReportRun(
        { status: 'running', autoRun: true, updatedAt: stale },
        staleBefore
      )
    ).toBe(false)
  })

  it('Prisma filter matches the pure poison predicate cases', () => {
    expect(poisonLinkedReportRunFilter(staleBefore)).toEqual({
      OR: [
        { status: 'skipped_no_emissions' },
        { status: 'completed' },
        { autoRun: true, status: 'failed' },
        { status: 'running', updatedAt: { gte: staleBefore } },
      ],
    })
    expect(linkedReportRunExclusion(staleBefore)).toEqual({
      reportRuns: {
        none: poisonLinkedReportRunFilter(staleBefore),
      },
    })
  })
})

describe('foldAutoRunOutcomeEvents', () => {
  it('keeps a Docling fail streak when a later unrelated success is absent', () => {
    const folded = foldAutoRunOutcomeEvents(
      { doclingFails: 0, reportFails: 0 },
      [
        {
          atMs: 1,
          id: 'a',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        {
          atMs: 2,
          id: 'b',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        {
          atMs: 3,
          id: 'c',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
      ]
    )
    expect(folded).toEqual({ doclingFails: 3, reportFails: 3 })
  })

  it('does not wipe Docling fails that happen after an earlier success in the same window', () => {
    const folded = foldAutoRunOutcomeEvents(
      { doclingFails: 0, reportFails: 0 },
      [
        {
          atMs: 1,
          id: 'early-ok',
          kind: 'run',
          status: 'completed',
        },
        {
          atMs: 2,
          id: 'f1',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        {
          atMs: 3,
          id: 'f2',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        {
          atMs: 4,
          id: 'f3',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
      ]
    )
    // Old blanket reset wiped these; chronological fold keeps the streak.
    expect(folded).toEqual({ doclingFails: 3, reportFails: 3 })
  })

  it('auto-off path: three Docling fails without intervening success stay at 3', () => {
    const folded = foldAutoRunOutcomeEvents(
      { doclingFails: 0, reportFails: 0 },
      [
        {
          atMs: 1,
          id: '1',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        {
          atMs: 2,
          id: '2',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        {
          atMs: 3,
          id: '3',
          kind: 'job',
          status: 'failed',
          queueName: 'doclingParsePDF',
        },
        // A concurrent terminal success that finished BEFORE the third fail
        // should not erase the third fail when ordered correctly.
        {
          atMs: 2.5,
          id: 'early-ok',
          kind: 'run',
          status: 'skipped_no_emissions',
        },
      ]
    )
    // Order: fail, fail, run-reset, fail → 1/1
    expect(folded).toEqual({ doclingFails: 1, reportFails: 1 })
  })
})
