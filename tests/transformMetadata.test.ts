import { Scope1Schema } from '../src/api/schemas/response'
import { transformMetadata } from '../src/api/services/companyService'

const metadataRow = {
  id: 'meta-1',
  comment: null,
  source: 'report',
  updatedAt: '2024-01-01T00:00:00.000Z',
  user: { name: 'Test User' },
  verifiedBy: null,
}

describe('transformMetadata', () => {
  it('collapses an empty metadata array to null', () => {
    const result = transformMetadata({
      id: 'scope-1',
      total: 100,
      unit: 'tCO2e',
      metadata: [],
    })

    expect(result.metadata).toBeNull()
  })

  it('collapses a metadata array to its first element', () => {
    const result = transformMetadata({
      id: 'scope-1',
      total: 100,
      unit: 'tCO2e',
      metadata: [metadataRow],
    })

    expect(result.metadata).toEqual(metadataRow)
  })

  it('validates transformed scope1 data with null metadata', () => {
    const transformed = transformMetadata({
      id: 'scope-1',
      total: 100,
      unit: 'tCO2e',
      metadata: [],
    })

    expect(Scope1Schema.safeParse(transformed).success).toBe(true)
  })
})
