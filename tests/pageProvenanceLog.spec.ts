import {
  countAttachedPageNumbers,
  formatPageProvenanceLog,
} from '../src/lib/pageProvenanceLog'

describe('pageProvenanceLog', () => {
  it('formats a searchable one-line stage log', () => {
    expect(
      formatPageProvenanceLog('chroma', {
        snippets: 12,
        matchedChunks: 40,
        totalChunks: 50,
      })
    ).toBe(
      'pageProvenance stage=chroma snippets=12 matchedChunks=40 totalChunks=50'
    )
  })

  it('counts attached pageNumber fields in nested extraction payloads', () => {
    expect(
      countAttachedPageNumbers({
        scope1: [
          {
            year: 2023,
            scope1: { total: 1, pageNumber: 10, sourceReference: 'p. 10' },
          },
        ],
        biogenic: [
          {
            year: 2023,
            biogenic: { total: 2, pageNumber: 4, sourceReference: 'p. 4' },
          },
        ],
      })
    ).toBe(2)
  })
})
