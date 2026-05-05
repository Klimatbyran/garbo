import {
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
