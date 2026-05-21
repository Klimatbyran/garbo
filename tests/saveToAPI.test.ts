import { jest } from '@jest/globals'

// canonicalPublicReportUrl is the only external dependency of the function under test.
// Mock it here so the test runs without a full API config environment.
jest.mock('../src/lib/saveUtils', () => ({
  canonicalPublicReportUrl: ({
    url,
    sourceUrl,
  }: {
    url: string
    sourceUrl?: string
  }) => {
    if (typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl.trim()))
      return sourceUrl.trim()
    return url
  },
}))

import { pickRegistryPayloadFromReportingPeriodsSave } from '../src/workers/saveToAPI.utils'
import type { RegistrySaveJobData } from '../src/workers/saveToAPI.utils'

function makeJob(overrides: Partial<RegistrySaveJobData> & { url: string }): {
  data: RegistrySaveJobData
} {
  return {
    data: {
      wikidata: { node: 'Q123' },
      companyName: 'Acme Corp',
      body: { reportingPeriods: [{ year: 2024 }] },
      ...overrides,
    },
  }
}

describe('pickRegistryPayloadFromReportingPeriodsSave', () => {
  // ── Guards ──────────────────────────────────────────────────────────────────

  it('returns null when companyName is missing', () => {
    expect(
      pickRegistryPayloadFromReportingPeriodsSave(
        makeJob({ url: 'https://company.com/report', companyName: undefined })
      )
    ).toBeNull()
  })

  it('returns null when wikidataId is not a Q-number', () => {
    expect(
      pickRegistryPayloadFromReportingPeriodsSave(
        makeJob({
          url: 'https://company.com/report',
          wikidata: { node: 'not-a-qid' },
        })
      )
    ).toBeNull()
  })

  it('returns null when reportingPeriods is empty', () => {
    expect(
      pickRegistryPayloadFromReportingPeriodsSave(
        makeJob({
          url: 'https://company.com/report',
          body: { reportingPeriods: [] },
        })
      )
    ).toBeNull()
  })

  // ── URL-only job (crawler-style: human URL, no S3, no pdfCache) ─────────────

  it('url-only: puts the human URL in `url`, leaves s3Url and sha256 undefined', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({ url: 'https://company.com/report-2024' })
    )
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://company.com/report-2024')
    expect(result!.s3Url).toBeUndefined()
    expect(result!.sha256).toBeUndefined()
    expect(result!.reportYear).toBe('2024')
  })

  // ── S3-only job (pipeline cached PDF, no sourceUrl) ─────────────────────────

  it('s3-only: puts S3 URL in both `url` and `s3Url` when no human URL is available', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({ url: 'https://storage.googleapis.com/garbo/abc.pdf' })
    )
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://storage.googleapis.com/garbo/abc.pdf')
    expect(result!.s3Url).toBe('https://storage.googleapis.com/garbo/abc.pdf')
  })

  // ── pdfCache with hash (pipeline-api provided sha256 + publicUrl) ───────────

  it('hash+s3: uses pdfCache sha256, promotes sourceUrl to url, and also stores it in sourceUrl', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({
        url: 'https://storage.googleapis.com/garbo/abc.pdf',
        sourceUrl: 'https://company.com/report-2024',
        pdfCache: {
          publicUrl: 'https://storage.googleapis.com/garbo/abc.pdf',
          sha256: 'a'.repeat(64),
        },
      })
    )
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://company.com/report-2024')
    expect(result!.s3Url).toBe('https://storage.googleapis.com/garbo/abc.pdf')
    expect(result!.sha256).toBe('a'.repeat(64))
    expect(result!.sourceUrl).toBe('https://company.com/report-2024')
  })

  // ── Cross-column: old pipeline put human URL in sourceUrl, S3 URL in url ────

  it('cross-column: promotes sourceUrl to url, keeps it in sourceUrl, and puts job url in s3Url', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({
        url: 'https://storage.googleapis.com/garbo/x.pdf',
        sourceUrl: 'https://company.com/sustainability-report',
      })
    )
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://company.com/sustainability-report')
    expect(result!.s3Url).toBe('https://storage.googleapis.com/garbo/x.pdf')
    expect(result!.sourceUrl).toBe('https://company.com/sustainability-report')
  })

  // ── reportYear derived from period ──────────────────────────────────────────

  it('uses the year of the chosen (first) period when no identity match', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({
        url: 'https://company.com/report',
        body: { reportingPeriods: [{ year: 2022 }, { year: 2024 }] },
      })
    )
    expect(result!.reportYear).toBe('2022')
  })

  it('falls back to max year when chosen period has no year', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({
        url: 'https://company.com/report',
        body: { reportingPeriods: [{}, { year: 2023 }, { year: 2024 }] },
      })
    )
    expect(result!.reportYear).toBe('2024')
  })

  it('prefers reportURL from the period that matches sha256', () => {
    const result = pickRegistryPayloadFromReportingPeriodsSave(
      makeJob({
        url: 'https://storage.googleapis.com/garbo/x.pdf',
        sourceUrl: 'https://company.com/annual',
        pdfCache: {
          publicUrl: 'https://storage.googleapis.com/garbo/x.pdf',
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
    )
    expect(result!.url).toBe('https://company.com/annual')
    expect(result!.sha256).toBe('b'.repeat(64))
  })
})
