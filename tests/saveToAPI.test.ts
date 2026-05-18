import { jest } from '@jest/globals'

// saveToAPI imports DiscordWorker which imports discord.js — mock the side-effectful modules
// so the test environment can load the module without a live Discord client.
jest.mock('../src/lib/DiscordWorker', () => ({ DiscordWorker: class {}, DiscordJob: class {} }))
jest.mock('../src/api/services/registryService', () => ({ registryService: {} }))
jest.mock('../src/api/services/registryCache', () => ({ invalidateRegistryCache: jest.fn() }))
jest.mock('../src/createCache', () => ({ createServerCache: jest.fn(() => ({})) }))
jest.mock('../src/lib/api', () => ({ apiFetch: jest.fn() }))
jest.mock('../src/lib/saveUtils', () => ({
  canonicalPublicReportUrl: ({ url, sourceUrl }: { url: string; sourceUrl?: string }) => {
    if (typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl.trim()))
      return sourceUrl.trim()
    return url
  },
}))

import { pickRegistryPayloadFromReportingPeriodsSave } from '../src/workers/saveToAPI'
import type { SaveToApiJob } from '../src/workers/saveToAPI'

/**
 * Builds a minimal SaveToApiJob for testing pickRegistryPayloadFromReportingPeriodsSave.
 * Only `job.data.*` is accessed by the function under test.
 */
function makeJob(
  overrides: Partial<SaveToApiJob['data']> & { url: string }
): SaveToApiJob {
  return {
    data: {
      wikidata: { node: 'Q123' },
      companyName: 'Acme Corp',
      apiSubEndpoint: 'reporting-periods',
      body: {
        reportingPeriods: [{ year: 2024 }],
      },
      channelId: '',
      autoApprove: false,
      ...overrides,
    },
  } as unknown as SaveToApiJob
}

describe('pickRegistryPayloadFromReportingPeriodsSave', () => {
  // ── Guards ──────────────────────────────────────────────────────────────────

  it('returns null when companyName is missing', () => {
    const job = makeJob({ url: 'https://company.com/report', companyName: undefined })
    expect(pickRegistryPayloadFromReportingPeriodsSave(job)).toBeNull()
  })

  it('returns null when wikidataId is not a Q-number', () => {
    const job = makeJob({
      url: 'https://company.com/report',
      wikidata: { node: 'not-a-qid' },
    })
    expect(pickRegistryPayloadFromReportingPeriodsSave(job)).toBeNull()
  })

  it('returns null when reportingPeriods is empty', () => {
    const job = makeJob({
      url: 'https://company.com/report',
      body: { reportingPeriods: [] },
    })
    expect(pickRegistryPayloadFromReportingPeriodsSave(job)).toBeNull()
  })

  // ── URL-only job (crawler-style: human URL, no S3, no pdfCache) ─────────────

  it('url-only: puts the human URL in `url`, leaves s3Url and sha256 undefined', () => {
    const job = makeJob({ url: 'https://company.com/report-2024' })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://company.com/report-2024')
    expect(result!.s3Url).toBeUndefined()
    expect(result!.sha256).toBeUndefined()
    expect(result!.reportYear).toBe('2024')
  })

  // ── S3-only job (pipeline cached PDF, no sourceUrl) ─────────────────────────

  it('s3-only: puts S3 URL in both `url` and `s3Url` when no human URL is available', () => {
    const job = makeJob({
      url: 'https://s3.amazonaws.com/garbo/abc.pdf',
    })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://s3.amazonaws.com/garbo/abc.pdf')
    expect(result!.s3Url).toBe('https://s3.amazonaws.com/garbo/abc.pdf')
  })

  // ── pdfCache with hash (pipeline-api provided sha256 + publicUrl) ───────────

  it('hash+s3: uses pdfCache sha256, promotes sourceUrl to url, and also stores it in sourceUrl', () => {
    const job = makeJob({
      url: 'https://s3.amazonaws.com/garbo/abc.pdf',
      sourceUrl: 'https://company.com/report-2024',
      pdfCache: {
        publicUrl: 'https://s3.amazonaws.com/garbo/abc.pdf',
        sha256: 'a'.repeat(64),
      },
    })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result).not.toBeNull()
    // Human URL promoted to `url`
    expect(result!.url).toBe('https://company.com/report-2024')
    // S3 copy in `s3Url`
    expect(result!.s3Url).toBe('https://s3.amazonaws.com/garbo/abc.pdf')
    // Hash from pdfCache
    expect(result!.sha256).toBe('a'.repeat(64))
    // sourceUrl always stored when it's a non-S3 HTTP URL, even if it equals url
    expect(result!.sourceUrl).toBe('https://company.com/report-2024')
  })

  // ── Cross-column: old pipeline put human URL in sourceUrl, S3 URL in url ────

  it('cross-column: promotes sourceUrl to url, keeps it in sourceUrl, and puts job url in s3Url', () => {
    // This is the scenario that historically caused duplicates:
    // the crawler stored { url: "https://company.com/report" } and the old pipeline
    // stored { url: "https://s3.aws/x.pdf", sourceUrl: "https://company.com/report" }.
    // After this fix the payload routes them to the right fields and sourceUrl is
    // always stored so callers can distinguish "confirmed human URL" from "S3 only".
    const job = makeJob({
      url: 'https://s3.amazonaws.com/garbo/x.pdf',
      sourceUrl: 'https://company.com/sustainability-report',
    })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://company.com/sustainability-report')
    expect(result!.s3Url).toBe('https://s3.amazonaws.com/garbo/x.pdf')
    // sourceUrl always stored when it's a non-S3 HTTP URL
    expect(result!.sourceUrl).toBe('https://company.com/sustainability-report')
  })

  // ── reportYear derived from period ──────────────────────────────────────────

  it('uses the year of the chosen (first) period when no identity match', () => {
    // `chosen` falls back to reportingPeriods[0]; reportYear comes from chosen.year.
    // maxYear is only a safety net when chosen.year is undefined.
    const job = makeJob({
      url: 'https://company.com/report',
      body: {
        reportingPeriods: [{ year: 2022 }, { year: 2024 }],
      },
    })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result!.reportYear).toBe('2022')
  })

  it('falls back to max year when chosen period has no year', () => {
    const job = makeJob({
      url: 'https://company.com/report',
      body: {
        reportingPeriods: [
          {},          // chosen (first) — no year
          { year: 2023 },
          { year: 2024 },
        ],
      },
    })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result!.reportYear).toBe('2024')
  })

  it('prefers reportURL from the period that matches sha256', () => {
    const job = makeJob({
      url: 'https://s3.amazonaws.com/garbo/x.pdf',
      sourceUrl: 'https://company.com/annual',
      pdfCache: {
        publicUrl: 'https://s3.amazonaws.com/garbo/x.pdf',
        sha256: 'b'.repeat(64),
      },
      body: {
        reportingPeriods: [
          {
            year: 2024,
            reportURL: 'https://company.com/annual',
            reportSha256: 'b'.repeat(64),
          },
        ],
      },
    })
    const result = pickRegistryPayloadFromReportingPeriodsSave(job)
    expect(result!.url).toBe('https://company.com/annual')
    expect(result!.sha256).toBe('b'.repeat(64))
  })
})
