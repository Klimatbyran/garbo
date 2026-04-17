import wikidataConfig from '../src/config/wikidata'
import { Emissions } from '../src/lib/emissions'
import { transformEmissionsToClaims } from '../src/lib/wikidata/util'

describe('transformEmissionsToClaims', () => {
  const startDate = '2025-01-01'
  const endDate = '2025-01-30'
  const referenceUrl = 'https://ref.example.com'
  const archiveUrl = 'https://archive.example.com'

  it('returns empty array when emissions are empty', () => {
    const emissions: Emissions = {}
    const claims = transformEmissionsToClaims(emissions, startDate, endDate)
    expect(claims).toEqual([])
    expect(claims).toHaveLength(0)
  })

  it('creates scope1 claim when total > 0 excludes 0/null/undefined', () => {
    const e1: Emissions = { scope1: { total: 100, unit: 'tCO2e' } }
    const e0: Emissions = { scope1: { total: 0, unit: 'tCO2e' } }
    const enull: Emissions = { scope1: { total: null, unit: 'tCO2e' } }
    const eundef: Emissions = {
      scope1: { total: undefined as any, unit: 'tCO2e' },
    }

    const claims1 = transformEmissionsToClaims(
      e1,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl
    )
    expect(claims1).toEqual([
      {
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        scope: wikidataConfig.entities.SCOPE_1,
        value: '100',
      },
    ])

    expect(
      transformEmissionsToClaims(
        e0,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl
      )
    ).toEqual([])
    expect(
      transformEmissionsToClaims(
        enull,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl
      )
    ).toEqual([])
    expect(
      transformEmissionsToClaims(
        eundef,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl
      )
    ).toEqual([])
  })

  it('creates scope2 claims for mb/lb/unknown when > 0; excludes 0/null/undefined', () => {
    const emissions: Emissions = {
      scope2: { mb: 50, lb: 60, unknown: 70, unit: 'tCO2e' },
    }
    const e0: Emissions = {
      scope2: {
        unit: 'tCO2e',
        mb: 0,
        lb: 0,
        unknown: 0,
      },
    }
    const eundef: Emissions = {
      scope2: {
        unit: 'tCO2e',
        mb: undefined,
        lb: undefined,
        unknown: undefined,
      },
    }
    const enull: Emissions = {
      scope2: {
        unit: 'tCO2e',
        mb: null,
        lb: null,
        unknown: null,
      },
    }

    const claims1 = transformEmissionsToClaims(
      emissions,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl
    )

    expect(claims1).toEqual([
      {
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        scope: wikidataConfig.entities.SCOPE_2_MARKET_BASED,
        value: '50',
      },
      {
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        scope: wikidataConfig.entities.SCOPE_2_LOCATION_BASED,
        value: '60',
      },
      {
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        scope: wikidataConfig.entities.SCOPE_2,
        value: '70',
      },
    ])

    expect(
      transformEmissionsToClaims(
        e0,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl
      )
    ).toEqual([])
    expect(
      transformEmissionsToClaims(
        eundef,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl
      )
    ).toEqual([])
    expect(
      transformEmissionsToClaims(
        enull,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl
      )
    ).toEqual([])
  })

  it('creates scope3 category claims including total=0 and maps category IDs', () => {
    const cat1Id = 1
    const cat2Id = 2
    const emissions: Emissions = {
      scope3: {
        categories: [
          { category: cat1Id, total: 0, unit: 'tCO2e' }, // included
          { category: cat2Id, total: 123.45, unit: 'tCO2e' }, // included
          { category: 3, total: null, unit: 'tCO2e' }, // excluded
          { category: 99, total: 10, unit: 'tCO2e' }, // mapping may be null
        ],
      },
    }

    const claims = transformEmissionsToClaims(
      emissions,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl
    )

    const expectedCat1 = wikidataConfig.translateIdToCategory(cat1Id)
    const expectedCat2 = wikidataConfig.translateIdToCategory(cat2Id)
    const expectedCat99 = wikidataConfig.translateIdToCategory(99) // will be null

    // Category claims (0, 123.45, 10) plus scope3 calculated total (0+123.45+10 = 133.45)
    expect(claims).toEqual([
      {
        scope: wikidataConfig.entities.SCOPE_3,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        category: expectedCat1,
        value: '0',
      },
      {
        scope: wikidataConfig.entities.SCOPE_3,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        category: expectedCat2,
        value: '123.45',
      },
      {
        scope: wikidataConfig.entities.SCOPE_3,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        category: expectedCat99,
        value: '10',
      },
      {
        scope: wikidataConfig.entities.SCOPE_3,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        value: '133.45',
      },
    ])
  })

  it('preserves order: scope1, scope2 mb, lb, unknown, then scope3 categories then scope3 total', () => {
    const emissions: Emissions = {
      scope1: { total: 1, unit: 'tCO2e' },
      scope2: { mb: 2, lb: 3, unknown: 4, unit: 'tCO2e' },
      scope3: { categories: [{ category: 1, total: 5, unit: 'tCO2e' }] },
    }
    const claims = transformEmissionsToClaims(emissions, startDate, endDate)

    expect(claims.map((c) => c.scope)).toEqual([
      wikidataConfig.entities.SCOPE_1,
      wikidataConfig.entities.SCOPE_2_MARKET_BASED,
      wikidataConfig.entities.SCOPE_2_LOCATION_BASED,
      wikidataConfig.entities.SCOPE_2,
      wikidataConfig.entities.SCOPE_3,
      wikidataConfig.entities.SCOPE_3,
    ])
  })
})
