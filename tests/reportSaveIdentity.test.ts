import {
  buildPipelineReportIdentity,
  buildReportingPeriodsApiBodyExtras,
  isReportIdentityKnownInCompany,
  periodMatchesReportIdentity,
  reportingPeriodsForReportIdentity,
} from '../src/lib/reportSaveIdentity'

describe('reportSaveIdentity', () => {
  const identity = {
    reportURL: 'https://storage.googleapis.com/garbo/abc.pdf',
    reportS3Url: 'https://storage.googleapis.com/garbo/abc.pdf',
    reportSha256: 'a'.repeat(64),
  }

  it('matches period by sha256', () => {
    expect(
      periodMatchesReportIdentity(
        { reportSha256: identity.reportSha256 },
        identity
      )
    ).toBe(true)
  })

  it('detects unknown identity on company', () => {
    expect(isReportIdentityKnownInCompany({ reportingPeriods: [] }, identity)).toBe(
      false
    )
  })

  it('detects known identity on company', () => {
    expect(
      isReportIdentityKnownInCompany(
        {
          reportingPeriods: [
            { year: '2025', reportSha256: identity.reportSha256 },
          ],
        },
        identity
      )
    ).toBe(true)
  })

  it('filters before-periods to this report shell only', () => {
    const company = {
      reportingPeriods: [
        { year: '2022', reportSha256: 'old' },
        { year: '2025', reportSha256: identity.reportSha256 },
      ],
    }
    expect(reportingPeriodsForReportIdentity(company, identity)).toHaveLength(1)
  })

  it('builds API body extras from job pdfCache', () => {
    const extras = buildReportingPeriodsApiBodyExtras(
      {
        url: 'https://storage.googleapis.com/garbo/abc.pdf',
        sourceUrl: 'uploaded:tele2-2025.pdf',
        pdfCache: {
          publicUrl: 'https://storage.googleapis.com/garbo/abc.pdf',
          sha256: identity.reportSha256,
        },
        replaceAllEmissions: true,
      },
      [{ year: 2025, startDate: '2025-01-01', endDate: '2025-12-31' }]
    )
    expect(extras.replaceAllEmissions).toBe(true)
    expect(extras.reportSha256).toBe(identity.reportSha256)
    expect(extras.documentReportYear).toBe('2025')
  })

  it('buildPipelineReportIdentity uses S3 url when source is upload placeholder', () => {
    const built = buildPipelineReportIdentity({
      url: 'https://storage.googleapis.com/garbo/abc.pdf',
      sourceUrl: 'uploaded:file.pdf',
      pdfCache: {
        publicUrl: 'https://storage.googleapis.com/garbo/abc.pdf',
        sha256: 'b'.repeat(64),
      },
    })
    expect(built.reportURL).toBe(
      'https://storage.googleapis.com/garbo/abc.pdf'
    )
    expect(built.reportSha256).toBe('b'.repeat(64))
  })
})
