import { reduceToMostRecentClaims } from '../src/lib/wikidata/edit'

describe('reduceToMostRecentClaims', () => {
  it('should return an empty array when given empty claims', () => {
    const result = reduceToMostRecentClaims([])
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it('should return only claims with id undefined when remove claims covers all claim IDs', () => {
    const claims = [
      {
        id: undefined,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
      {
        id: 'Q2',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ]
    const claimsToRemove = [
      {
        id: 'Q1',
        remove: true,
      },
      {
        id: 'Q2',
        remove: true,
      },
    ]
    // Should only keep the new claim with undefined id.
    const result = reduceToMostRecentClaims(claims, claimsToRemove)
    expect(result).toEqual([
      {
        id: undefined,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ])
    expect(result).toHaveLength(1)
  })

  it('should return only claims with the highest (latest) endDate', () => {
    const claims = [
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ]
    const result = reduceToMostRecentClaims(claims)

    expect(result).toEqual([
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ])
    expect(result).toHaveLength(1)
  })

  it('should return all claims with identical most recent endDate', () => {
    const claims = [
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ]

    const result = reduceToMostRecentClaims(claims)

    expect(result).toEqual(claims)
    expect(result).toHaveLength(2)
  })

  it('should only include non-removed claims when given both removed and non-removed claims with same endDate', () => {
    const claims = [
      {
        id: 'Q1',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
      {
        id: 'Q2',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ]

    const claimsToRemove = [
      {
        id: 'Q1',
        remove: true,
      },
    ]

    const result = reduceToMostRecentClaims(claims, claimsToRemove)
    expect(result).toEqual([
      {
        id: 'Q2',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        referenceUrl: 'https://ref.example.com',
        archiveUrl: 'https://archive.example.com',
        value: '+100',
      },
    ])
    expect(result).toHaveLength(1)
  })
})
