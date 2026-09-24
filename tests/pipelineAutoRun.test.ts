import {
  pipelineAutoRunFiltersSchema,
  pipelineAutoRunOptionsSchema,
  pipelineAutoRunPatchSchema,
  DOCLING_FAILURE_AUTO_OFF,
  REPORT_FAILURE_AUTO_OFF,
  reportRunnableUrl,
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
