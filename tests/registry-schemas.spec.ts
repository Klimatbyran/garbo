import {
  registryDeleteResponseSchema,
  registryUpdateRequestBodySchema,
  saveReportsBodySchema,
  registryDeleteRequestBodySchema,
} from '../src/api/schemas'

describe('registryUpdateRequestBodySchema', () => {
  test('rejects payload with only id and no update fields', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
    })
    expect(result.success).toBe(false)
  })

  test('rejects empty id', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: '',
      companyName: 'Acme Corp',
    })
    expect(result.success).toBe(false)
  })

  test('rejects empty companyName', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      companyName: '',
    })
    expect(result.success).toBe(false)
  })

  test('rejects empty wikidataId', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      wikidataId: '',
    })
    expect(result.success).toBe(false)
  })

  test('accepts companyName as the sole update field', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      companyName: 'Acme Corp',
    })
    expect(result.success).toBe(true)
  })

  test('accepts wikidataId as the sole update field', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      wikidataId: 'Q12345',
    })
    expect(result.success).toBe(true)
  })

  test('accepts reportYear as the sole update field', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      reportYear: '2024',
    })
    expect(result.success).toBe(true)
  })

  test('accepts url as the sole update field', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      url: 'https://example.com/report.pdf',
    })
    expect(result.success).toBe(true)
  })

  test('rejects a 3-digit reportYear', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      reportYear: '202',
    })
    expect(result.success).toBe(false)
  })

  test('rejects a reportYear below 1900', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      reportYear: '1899',
    })
    expect(result.success).toBe(false)
  })

  test('rejects a reportYear above 2100', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      reportYear: '2101',
    })
    expect(result.success).toBe(false)
  })

  test('rejects an invalid url', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  test('accepts all four optional fields together', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      companyName: 'Acme Corp',
      wikidataId: 'Q12345',
      reportYear: '2024',
      url: 'https://example.com/report.pdf',
    })
    expect(result.success).toBe(true)
  })

  test('accepts sourceUrl null as sole update to clear', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      sourceUrl: null,
    })
    expect(result.success).toBe(true)
  })

  test('accepts s3Key null as sole update', () => {
    const result = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      s3Key: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('registryDeleteRequestBodySchema', () => {
  test('accepts an array with valid ids', () => {
    const result = registryDeleteRequestBodySchema.safeParse([
      { id: 'report_123' },
      { id: 'report_456' },
    ])
    expect(result.success).toBe(true)
  })

  test('accepts an empty array', () => {
    const result = registryDeleteRequestBodySchema.safeParse([])
    expect(result.success).toBe(true)
  })

  test('rejects an entry with empty id', () => {
    const result = registryDeleteRequestBodySchema.safeParse([{ id: '' }])
    expect(result.success).toBe(false)
  })

  test('rejects an entry with missing id', () => {
    const result = registryDeleteRequestBodySchema.safeParse([{}])
    expect(result.success).toBe(false)
  })
})

describe('saveReportsBodySchema', () => {
  const validReport = {
    companyName: 'Acme Corp',
    reportYear: '2024',
    url: 'https://example.com/report.pdf',
  }

  test('accepts a valid report entry', () => {
    const result = saveReportsBodySchema.safeParse([validReport])
    expect(result.success).toBe(true)
  })

  test('accepts optional wikidataId', () => {
    const result = saveReportsBodySchema.safeParse([
      { ...validReport, wikidataId: 'Q12345' },
    ])
    expect(result.success).toBe(true)
  })

  test('rejects empty companyName', () => {
    const result = saveReportsBodySchema.safeParse([
      { ...validReport, companyName: '' },
    ])
    expect(result.success).toBe(false)
  })

  test('rejects missing url', () => {
    const { url: _url, ...withoutUrl } = validReport
    const result = saveReportsBodySchema.safeParse([withoutUrl])
    expect(result.success).toBe(false)
  })

  test('rejects an invalid url', () => {
    const result = saveReportsBodySchema.safeParse([
      { ...validReport, url: 'not-a-url' },
    ])
    expect(result.success).toBe(false)
  })

  test('rejects a 3-digit reportYear', () => {
    const result = saveReportsBodySchema.safeParse([
      { ...validReport, reportYear: '202' },
    ])
    expect(result.success).toBe(false)
  })

  test('rejects a reportYear below 1900', () => {
    const result = saveReportsBodySchema.safeParse([
      { ...validReport, reportYear: '1899' },
    ])
    expect(result.success).toBe(false)
  })

  test('rejects a reportYear above 2100', () => {
    const result = saveReportsBodySchema.safeParse([
      { ...validReport, reportYear: '2101' },
    ])
    expect(result.success).toBe(false)
  })
})

describe('registryDeleteResponseSchema', () => {
  test('accepts a response with wikidataId', () => {
    const result = registryDeleteResponseSchema.safeParse({
      message: 'Successfully deleted 1 report(s)',
      deletedReports: [
        {
          id: 'report_123',
          companyName: 'Acme Corp',
          wikidataId: 'Q12345',
          reportYear: '2024',
          url: 'https://example.com/report.pdf',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  test('accepts a response with null companyName and wikidataId', () => {
    const result = registryDeleteResponseSchema.safeParse({
      message: 'Successfully deleted 1 report(s)',
      deletedReports: [
        {
          id: 'report_123',
          companyName: null,
          wikidataId: null,
          reportYear: null,
          url: 'https://example.com/report.pdf',
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})
