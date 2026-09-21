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
  normalizeForMatch,
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

  it('archives follow-up return value without duplicating markdown context', () => {
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
      metadata: { prompt: 'test', context: 'huge retrieved markdown' },
    }

    expect(archiveFieldsFromFollowUpReturnValue(returnValue)).toEqual({
      sourceReference: 'p. 12',
      extractionResult: {
        value: returnValue.value,
        metadata: { prompt: 'test' },
      },
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

  it('does not match bare numbers inside larger numbers', () => {
    const value = {
      scope2: [
        {
          year: 2023,
          scope2: { mb: 55, unit: 'tCO2e' },
        },
      ],
    }

    const enriched = attachPageProvenanceToExtraction(value, [
      { text: 'Base year 2055 emissions inventory', pageNumber: 3 },
      { text: 'Market-based Scope 2 was 55 tCO2e', pageNumber: 11 },
    ]) as {
      scope2: Array<{ scope2: { pageNumber?: number; sourceReference?: string } }>
    }

    expect(enriched.scope2[0].scope2.pageNumber).toBe(11)
    expect(enriched.scope2[0].scope2.sourceReference).toBe('p. 11')
  })

  it('uses scope2 exact quotes when present', () => {
    const value = {
      scope2: [
        {
          year: 2023,
          scope2: { mb: 10, unit: 'tCO2e' },
          listOfAllScope2NumbersForThisYearAndTheirMethods: [
            {
              exactQuoteOfNumberInTheDocumentBeforeAnyConversion:
                'location-based electricity 10 thousand tonnes',
            },
          ],
        },
      ],
    }

    const enriched = attachPageProvenanceToExtraction(value, [
      { text: 'Something with 10 employees on page 2', pageNumber: 2 },
      {
        text: 'location-based electricity 10 thousand tonnes on page 8',
        pageNumber: 8,
      },
    ]) as {
      scope2: Array<{ scope2: { pageNumber?: number } }>
    }

    expect(enriched.scope2[0].scope2.pageNumber).toBe(8)
  })

  it('assigns pages per scope value when they differ', () => {
    const value = {
      scope1: [
        {
          year: 2023,
          scope1: { total: 12.3, unit: 'tCO2e' },
          scope1And2: { total: 99.1, unit: 'tCO2e' },
        },
      ],
    }

    const enriched = attachPageProvenanceToExtraction(value, [
      { text: 'Combined scope 1+2 total 99.1 tCO2e', pageNumber: 20 },
      { text: 'Scope 1 alone was 12.3 tCO2e', pageNumber: 14 },
    ]) as {
      scope1: Array<{
        scope1: { pageNumber?: number }
        scope1And2: { pageNumber?: number }
      }>
    }

    expect(enriched.scope1[0].scope1.pageNumber).toBe(14)
    expect(enriched.scope1[0].scope1And2.pageNumber).toBe(20)
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
              data: {
                table_cells: [
                  { text: '12.3 tCO2e Scope 1 total' },
                  { text: 'Scope 1' },
                ],
              },
            },
          ],
        },
      },
    })

    expect(result.markdown).toBe(markdown)
    expect(result.pageSnippets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Introduction text',
          pageNumber: 1,
          normalized: normalizeForMatch('Introduction text'),
        }),
        expect.objectContaining({
          text: 'Scope 1 emissions',
          pageNumber: 4,
        }),
        expect.objectContaining({
          text: '12.3 tCO2e Scope 1 total',
          pageNumber: 4,
        }),
      ])
    )
  })

  it('can skip page snippets for callback-only parses', () => {
    const result = extractDoclingMarkdown(
      {
        document: {
          md_content: '# Report',
          json_content: {
            texts: [{ text: 'Introduction text', prov: [{ page_no: 1 }] }],
          },
        },
      },
      { includePageSnippets: false }
    )
    expect(result.markdown).toBe('# Report')
    expect(result.pageSnippets).toEqual([])
  })

  it('interleaves table cells ahead of later-page texts under the cap', () => {
    const texts = Array.from({ length: 30 }, (_, i) => ({
      text: `Early overview paragraph number ${i} with enough chars`,
      prov: [{ page_no: 1 }],
    }))
    const snippets = pageSnippetsFromDoclingJson({
      texts,
      tables: [
        {
          prov: [{ page_no: 1 }],
          data: {
            table_cells: [{ text: 'Market-based Scope 2 total cell' }],
          },
        },
      ],
    })

    expect(snippets.some((s) => s.text.includes('Market-based Scope 2'))).toBe(
      true
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
    expect(pageNumberFromSourceReference('top 5 priorities')).toBeUndefined()
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
