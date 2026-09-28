import {
  pipelineAutoRunFiltersSchema,
  pipelineAutoRunOptionsSchema,
  pipelineAutoRunPatchSchema,
  DOCLING_FAILURE_AUTO_OFF,
  REPORT_FAILURE_AUTO_OFF,
  reportRunnableUrl,
  pickCandidatesFromPage,
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
