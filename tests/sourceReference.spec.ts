import {
  extractSourceReferenceFromExtractionValue,
  archiveFieldsFromFollowUpReturnValue,
  buildSourcePageUrl,
  resolveSourcePageUrl,
  pageNumberFromSourceReference,
  attachPageProvenanceToExtraction,
} from '../src/lib/sourceReference'
import {
  pageSnippetsFromDoclingJson,
  pageNumberForMarkdownSnippet,
  extractDoclingMarkdown,
} from '../src/lib/doclingPageLookup'
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

  it('attaches page provenance from retrieved Chroma paragraphs without LLM', () => {
    const value = {
      scope1: [
        {
          year: 2023,
          scope1: { total: 12.3, unit: 'tCO2e' },
          listOfAllPossibleScope1Numbers: [
            {
              number: 12.3,
              sourceText: 'Scope 1 emissions were 12.3 tCO2e',
            },
          ],
        },
      ],
    }

    const enriched = attachPageProvenanceToExtraction(value, [
      {
        text: 'Other text on page 9',
        pageNumber: 9,
      },
      {
        text: 'Scope 1 emissions were 12.3 tCO2e according to the GHG table',
        pageNumber: 42,
      },
    ])

    expect(enriched).toEqual({
      scope1: [
        {
          year: 2023,
          scope1: {
            total: 12.3,
            unit: 'tCO2e',
            pageNumber: 42,
            sourceReference: 'p. 42',
          },
          listOfAllPossibleScope1Numbers: [
            {
              number: 12.3,
              sourceText: 'Scope 1 emissions were 12.3 tCO2e',
            },
          ],
        },
      ],
    })
  })
})

describe('doclingPageLookup', () => {
  it('keeps Docling markdown unchanged and only extracts page snippets from JSON', () => {
    const markdown = '# Report\n\n| Scope | Value |\n| --- | --- |\n| 1 | 12 |'
    const result = extractDoclingMarkdown({
      document: {
        md_content: markdown,
        json_content: {
          texts: [
            { text: 'Introduction text', prov: [{ page_no: 1 }] },
            { text: 'Scope 1 emissions', prov: [{ page_no: 4 }] },
          ],
          tables: [
            {
              prov: [{ page_no: 4 }],
              data: { table_cells: [{ text: '12.3 tCO2e Scope 1 total' }, { text: 'Scope 1' }] },
            },
          ],
        },
      },
    })

    expect(result.markdown).toBe(markdown)
    expect(result.pageSnippets).toEqual(
      expect.arrayContaining([
        { text: 'Introduction text', pageNumber: 1 },
        { text: 'Scope 1 emissions', pageNumber: 4 },
        { text: '12.3 tCO2e Scope 1 total', pageNumber: 4 },
      ])
    )
  })

  it('matches markdown chunks to page snippets including table cells', () => {
    const snippets = pageSnippetsFromDoclingJson({
      texts: [{ text: 'Company overview', prov: [{ page_no: 2 }] }],
      tables: [
        {
          prov: [{ page_no: 7 }],
          data: {
            table_cells: [{ text: 'Market-based Scope 2' }, { text: '55' }],
          },
        },
      ],
    })

    expect(
      pageNumberForMarkdownSnippet(
        '## Emissions\n\nMarket-based Scope 2 was 55 tCO2e',
        snippets
      )
    ).toBe(7)
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
