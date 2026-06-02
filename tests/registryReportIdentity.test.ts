import {
  buildReportMatchConditions,
  copyMissingFields,
  linkReportRowsByPdfBasename,
  parseReportYearFromUrl,
  pdfBasenameFromUrl,
  pdfBasenamesMatchForIdentityLink,
  preferReportYearFromWebUrls,
  pickRowToKeep,
  storageBasenameTailForMatch,
  type RegistryReportIdentityRow,
} from '../src/api/services/registryReportIdentity'
import {
  findDuplicateReportGroups,
  mergeDuplicateReportRows,
} from '../src/api/services/registryReportDedupe'

function row(
  p: Partial<RegistryReportIdentityRow> & { id: string; url: string }
): RegistryReportIdentityRow {
  return {
    id: p.id,
    url: p.url,
    sourceUrl: p.sourceUrl ?? null,
    s3Url: p.s3Url ?? null,
    s3Key: p.s3Key ?? null,
    s3Bucket: p.s3Bucket ?? null,
    sha256: p.sha256 ?? null,
    companyName: p.companyName ?? null,
    wikidataId: p.wikidataId ?? null,
    reportYear: p.reportYear ?? null,
  }
}

describe('registryReportIdentity', () => {
  describe('buildReportMatchConditions', () => {
    it('includes direct field matches', () => {
      const or = buildReportMatchConditions({
        url: 'https://company.com/report',
        sourceUrl: 'https://source.example/r.pdf',
        s3Url: 'https://s3.amazonaws.com/r.pdf',
        sha256: 'a'.repeat(64),
      })
      expect(or).toEqual(
        expect.arrayContaining([
          { sha256: 'a'.repeat(64) },
          { sourceUrl: 'https://source.example/r.pdf' },
          { url: 'https://company.com/report' },
          { s3Url: 'https://s3.amazonaws.com/r.pdf' },
        ])
      )
    })

    it('includes cross-link { url: sourceUrl } so crawler row is found when pipeline sends sourceUrl', () => {
      // Crawler saved { url: "https://company.com/report" }.
      // Pipeline upserts with { url: "https://s3.aws/x.pdf", sourceUrl: "https://company.com/report" }.
      // Without the cross-link the OR query would never match the crawler row.
      const or = buildReportMatchConditions({
        url: 'https://s3.amazonaws.com/x.pdf',
        sourceUrl: 'https://company.com/report',
      })
      expect(or).toEqual(
        expect.arrayContaining([{ url: 'https://company.com/report' }])
      )
    })

    it('includes cross-link { sourceUrl: url } for the reverse case', () => {
      const or = buildReportMatchConditions({
        url: 'https://company.com/report',
        sourceUrl: null,
      })
      expect(or).toEqual(
        expect.arrayContaining([{ sourceUrl: 'https://company.com/report' }])
      )
    })

    it('does not add redundant cross-link when url and sourceUrl are identical', () => {
      const or = buildReportMatchConditions({
        url: 'https://company.com/report',
        sourceUrl: 'https://company.com/report',
      })
      const urlMatches = or.filter(
        (c) => 'url' in c && c.url === 'https://company.com/report'
      )
      // Only one { url: … } clause — no duplicate from cross-link
      expect(urlMatches).toHaveLength(1)
    })

    it('omits null/empty fields', () => {
      const or = buildReportMatchConditions({
        url: '',
        sourceUrl: null,
        s3Url: null,
        sha256: null,
      })
      expect(or).toHaveLength(0)
    })
  })

  it('pickRowToKeep prefers the row with more identity fields filled in', () => {
    const low = row({
      id: 'z',
      url: 'https://x',
      sha256: null,
      sourceUrl: null,
      s3Url: null,
    })
    const high = row({
      id: 'y',
      url: 'https://y',
      sha256: 'a'.repeat(64),
      sourceUrl: 'https://s',
      s3Url: 'https://s3',
    })
    expect(pickRowToKeep([low, high]).id).toBe(high.id)
  })

  describe('pdfBasenameFromUrl', () => {
    it('returns the lowercased last path segment', () => {
      expect(
        pdfBasenameFromUrl(
          'https://storage.googleapis.com/bucket/path/Annual_Report_2024.pdf'
        )
      ).toBe('annual_report_2024.pdf')
      expect(
        pdfBasenameFromUrl(
          'https://company.com/investors/Annual_Report_2024.pdf'
        )
      ).toBe('annual_report_2024.pdf')
    })
  })

  describe('parseReportYearFromUrl', () => {
    it('extracts the latest year from the file name only (2000–2026)', () => {
      expect(
        parseReportYearFromUrl(
          'https://storage.googleapis.com/b/klimat_Q123_2024_report.pdf'
        )
      ).toBe('2024')
      expect(
        parseReportYearFromUrl(
          'https://company.com/docs/compare_2022_2024_annual.pdf'
        )
      ).toBe('2024')
    })

    it('ignores years in parent path segments', () => {
      expect(
        parseReportYearFromUrl(
          'https://storage.googleapis.com/b/2019/archive/sustainability-report.pdf'
        )
      ).toBeNull()
    })

    it('ignores years outside 2000–2026', () => {
      expect(
        parseReportYearFromUrl(
          'https://storage.googleapis.com/b/annual_report_1999.pdf'
        )
      ).toBeNull()
    })
  })

  describe('pdfBasenamesMatchForIdentityLink', () => {
    it('matches exact basenames and legacy GCS prefixed storage names', () => {
      expect(
        pdfBasenamesMatchForIdentityLink(
          'addtech-annual-report-2019-2020.pdf',
          'addtech_q10400997_2020_addtech-annual-report-2019-2020.pdf'
        )
      ).toBe(true)
      expect(
        storageBasenameTailForMatch(
          'addtech_q10400997_2020_addtech-annual-report-2019-2020.pdf'
        )
      ).toBe('addtech-annual-report-2019-2020.pdf')
    })

    it('does not match unrelated PDFs for the same company', () => {
      expect(
        pdfBasenamesMatchForIdentityLink(
          'annual-report-2023.pdf',
          'annual-report-2024.pdf'
        )
      ).toBe(false)
    })
  })

  describe('linkReportRowsByPdfBasename', () => {
    it('unions a web-only row with a storage-only row for the same company and file name', () => {
      const web = row({
        id: 'web',
        wikidataId: 'Q1',
        url: 'https://company.com/docs/Annual_Report_2024.pdf',
      })
      const gcs = row({
        id: 'gcs',
        wikidataId: 'Q1',
        url: 'https://storage.googleapis.com/bucket/Annual_Report_2024.pdf',
        s3Url: 'https://storage.googleapis.com/bucket/Annual_Report_2024.pdf',
      })

      const parent = new Map<string, string>()
      const dsu = {
        find(id: string) {
          let p = parent.get(id) ?? id
          while (parent.get(p) && parent.get(p) !== p) {
            p = parent.get(p)!
          }
          parent.set(id, p)
          return p
        },
        union(a: string, b: string) {
          const ra = this.find(a)
          const rb = this.find(b)
          if (ra !== rb) parent.set(rb, ra)
        },
      }

      linkReportRowsByPdfBasename([web, gcs], dsu)
      expect(dsu.find('web')).toBe(dsu.find('gcs'))
    })

    it('unions web and legacy GCS names when the storage basename embeds the web file name', () => {
      const web = row({
        id: 'web',
        wikidataId: 'Q1',
        url: 'https://company.com/docs/infranord-ar-2019.pdf',
      })
      const gcs = row({
        id: 'gcs',
        wikidataId: 'Q1',
        url: 'https://storage.googleapis.com/bucket/infranord_q10535401_2019_infranord-ar-2019.pdf',
        s3Url:
          'https://storage.googleapis.com/bucket/infranord_q10535401_2019_infranord-ar-2019.pdf',
      })

      const groups = findDuplicateReportGroups([web, gcs])
      expect(groups).toHaveLength(1)
      expect(groups[0]).toEqual(expect.arrayContaining(['web', 'gcs']))
    })
  })

  describe('mergeDuplicateReportRows', () => {
    it('prefers reportYear from the web URL when merging', () => {
      const web = row({
        id: 'web',
        wikidataId: 'Q1',
        reportYear: '2021',
        url: 'https://company.com/afry_2021_annual.pdf',
        sourceUrl: 'https://company.com/afry_2021_annual.pdf',
      })
      const gcs = row({
        id: 'gcs',
        wikidataId: 'Q1',
        reportYear: '2017',
        url: 'https://storage.googleapis.com/b/afry_q1_2021_afry_2021_annual.pdf',
        s3Url:
          'https://storage.googleapis.com/b/afry_q1_2021_afry_2021_annual.pdf',
      })

      expect(preferReportYearFromWebUrls(web)).toBe('2021')
      const merged = mergeDuplicateReportRows([web, gcs])
      expect(merged.reportYear).toBe('2021')

      const cisionWeb = row({
        id: 'web',
        wikidataId: 'Q1',
        reportYear: '2022',
        url: 'https://mb.cision.com/Main/1921081.pdf',
        sourceUrl: 'https://mb.cision.com/Main/1921081.pdf',
      })
      const cisionGcs = row({
        id: 'gcs',
        wikidataId: 'Q1',
        reportYear: '2021',
        url: 'https://storage.googleapis.com/b/evolution_q1_2022_1921081.pdf',
        s3Url: 'https://storage.googleapis.com/b/evolution_q1_2022_1921081.pdf',
      })
      expect(mergeDuplicateReportRows([cisionWeb, cisionGcs]).reportYear).toBe(
        '2022'
      )
      expect(merged.sourceUrl).toBe(web.sourceUrl)
      expect(merged.s3Url).toBe(gcs.s3Url)
    })
  })

  it('copyMissingFields fills empty slots from the row being deleted', () => {
    const rowToKeep = row({
      id: 'a',
      url: 'https://storage.googleapis.com/garbo/x.pdf',
      s3Url: null,
      sourceUrl: null,
    })
    const rowToDelete = row({
      id: 'b',
      url: 'https://human/page',
      s3Url: 'https://storage.googleapis.com/garbo/x.pdf',
      sourceUrl: 'https://src',
    })
    const patch = copyMissingFields(rowToKeep, rowToDelete)
    expect(patch.sourceUrl).toBe('https://src')
    expect(patch.url).toBe('https://human/page')
  })
})
