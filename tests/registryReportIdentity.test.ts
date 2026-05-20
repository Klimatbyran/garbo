import {
  buildReportLookupOr,
  mergeNullReportFields,
  pickSurvivorReport,
  type RegistryReportIdentityRow,
} from '../src/api/services/registryReportIdentity'

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
  describe('buildReportLookupOr', () => {
    it('includes direct field matches', () => {
      const or = buildReportLookupOr({
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
      const or = buildReportLookupOr({
        url: 'https://s3.amazonaws.com/x.pdf',
        sourceUrl: 'https://company.com/report',
      })
      expect(or).toEqual(
        expect.arrayContaining([{ url: 'https://company.com/report' }])
      )
    })

    it('includes cross-link { sourceUrl: url } for the reverse case', () => {
      const or = buildReportLookupOr({
        url: 'https://company.com/report',
        sourceUrl: null,
      })
      expect(or).toEqual(
        expect.arrayContaining([{ sourceUrl: 'https://company.com/report' }])
      )
    })

    it('does not add redundant cross-link when url and sourceUrl are identical', () => {
      const or = buildReportLookupOr({
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
      const or = buildReportLookupOr({
        url: '',
        sourceUrl: null,
        s3Url: null,
        sha256: null,
      })
      expect(or).toHaveLength(0)
    })
  })

  it('pickSurvivorReport prefers richer identity', () => {
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
    expect(pickSurvivorReport([low, high]).id).toBe(high.id)
  })

  it('mergeNullReportFields fills gaps from donor', () => {
    const target = row({
      id: 'a',
      url: 'https://bucket.s3.amazonaws.com/x.pdf',
      s3Url: null,
      sourceUrl: null,
    })
    const donor = row({
      id: 'b',
      url: 'https://human/page',
      s3Url: 'https://bucket.s3.amazonaws.com/x.pdf',
      sourceUrl: 'https://src',
    })
    const patch = mergeNullReportFields(target, donor)
    expect(patch.sourceUrl).toBe('https://src')
    expect(patch.url).toBe('https://human/page')
  })
})
