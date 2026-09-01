import {
  extractSourceReferenceFromExtractionValue,
  archiveFieldsFromFollowUpReturnValue,
  buildSourcePageUrl,
  resolveSourcePageUrl,
  pageNumberFromSourceReference,
} from '../src/lib/sourceReference'
import { mergeScope1AndScope2Results } from '../src/lib/mergeScopeResults'

describe('sourceReference', () => {
  it('extracts sourceReference from scope1 chosen values', () => {
    const value = {
      scope1: [
        {
          year: 2023,
          scope1: { total: 12, unit: 'tCO2e', sourceReference: 'p. 42' },
        },
      ],
    }

    expect(extractSourceReferenceFromExtractionValue(value)).toBe('p. 42')
  })

  it('extracts sourceReference from scope3 categories', () => {
    const value = {
      scope3: [
        {
          year: 2023,
          scope3: {
            categories: [
              {
                category: 1,
                total: 10,
                unit: 'tCO2e',
                sourceReference: 'p. 55, Category 1 table',
              },
            ],
          },
        },
      ],
    }

    expect(extractSourceReferenceFromExtractionValue(value)).toBe(
      'p. 55, Category 1 table'
    )
  })

  it('archives follow-up return value with extractionResult', () => {
    const returnValue = {
      value: {
        scope2: [
          {
            year: 2024,
            scope2: {
              mb: 1,
              unit: 'tCO2e',
              sourceReference: 'p. 12',
            },
          },
        ],
      },
      metadata: { prompt: 'test' },
    }

    expect(archiveFieldsFromFollowUpReturnValue(returnValue)).toEqual({
      sourceReference: 'p. 12',
      extractionResult: returnValue,
    })
  })
})

describe('sourcePageUrl', () => {
  const storageUrl =
    'https://storage.googleapis.com/garbo-reports/Q123/report-2024.pdf'

  it('builds a #page=N deep link from the storage PDF URL', () => {
    expect(buildSourcePageUrl(storageUrl, 42)).toBe(`${storageUrl}#page=42`)
  })

  it('strips an existing hash before appending #page', () => {
    expect(buildSourcePageUrl(`${storageUrl}#page=1`, 9)).toBe(
      `${storageUrl}#page=9`
    )
  })

  it('parses page numbers from sourceReference when pageNumber is missing', () => {
    expect(pageNumberFromSourceReference('p. 42, GHG table')).toBe(42)
    expect(
      resolveSourcePageUrl({
        storagePdfUrl: storageUrl,
        sourceReference: 'p. 12',
      })
    ).toBe(`${storageUrl}#page=12`)
  })

  it('prefers an explicit sourcePageUrl when provided', () => {
    expect(
      resolveSourcePageUrl({
        storagePdfUrl: storageUrl,
        pageNumber: 3,
        sourcePageUrl: `${storageUrl}#page=99`,
      })
    ).toBe(`${storageUrl}#page=99`)
  })

  it('returns undefined without a storage URL or page', () => {
    expect(buildSourcePageUrl(undefined, 5)).toBeUndefined()
    expect(buildSourcePageUrl(storageUrl, undefined)).toBeUndefined()
  })
})

describe('mergeScope1AndScope2Results', () => {
  it('carries sourceReference and pageNumber on merged scope values', () => {
    const scope1 = [
      {
        year: 2023,
        absoluteMostRecentYearInReport: 2023,
        scope1: {
          total: 10,
          unit: 'tCO2e' as const,
          sourceReference: 'p. 10',
          pageNumber: 10,
        },
      },
    ]
    const scope2 = [
      {
        year: 2023,
        absoluteMostRecentYearInReport: 2023,
        scope2: {
          mb: 5,
          unit: 'tCO2e' as const,
          sourceReference: 'p. 11',
          pageNumber: 11,
        },
      },
    ]

    const merged = mergeScope1AndScope2Results(scope1, scope2, undefined)

    expect(merged).toEqual([
      {
        year: 2023,
        absoluteMostRecentYearInReport: 2023,
        scope1: {
          total: 10,
          unit: 'tCO2e',
          sourceReference: 'p. 10',
          pageNumber: 10,
        },
        scope2: {
          mb: 5,
          unit: 'tCO2e',
          sourceReference: 'p. 11',
          pageNumber: 11,
        },
        scope1And2: undefined,
        sourceReference: 'p. 10',
        pageNumber: 10,
      },
    ])
  })
})
