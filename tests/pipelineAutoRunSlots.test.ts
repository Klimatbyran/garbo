import {
  AUTO_RUN_SLOT_QUEUES,
  AUTO_RUN_APPROVAL_QUEUES,
  reportUrlVariants,
  pickCandidatesFromPage,
} from '../src/api/services/pipelineAutoRunTypes'

describe('AUTO_RUN_SLOT_QUEUES', () => {
  it('includes Docling-early and mid-pipeline LLM/API queues', () => {
    expect(AUTO_RUN_SLOT_QUEUES).toEqual(
      expect.arrayContaining([
        'parsePdf',
        'doclingParsePDF',
        'indexMarkdown',
        'checkEmissionsPresence',
        'extractEmissions',
        'followUpScope1',
        'saveToAPI',
        'guessWikidata',
      ])
    )
  })

  it('lists approval parks as a subset of slot queues', () => {
    for (const q of AUTO_RUN_APPROVAL_QUEUES) {
      expect(AUTO_RUN_SLOT_QUEUES).toContain(q)
    }
  })
})

describe('reportUrlVariants', () => {
  it('dedupes by returning trimmed non-empty url/source/s3', () => {
    expect(
      reportUrlVariants({
        url: ' https://a.example/r.pdf ',
        sourceUrl: 'https://a.example/r.pdf',
        s3Url: null,
      })
    ).toEqual([
      'https://a.example/r.pdf',
      'https://a.example/r.pdf',
    ])
  })
})

describe('pickCandidatesFromPage empty variants', () => {
  it('skips rows with blank url fields', () => {
    const picked = pickCandidatesFromPage(
      [
        {
          id: '1',
          url: '   ',
          sourceUrl: null,
          s3Url: null,
          companyName: null,
          wikidataId: null,
        },
        {
          id: '2',
          url: 'https://ok.example/b.pdf',
          sourceUrl: null,
          s3Url: null,
          companyName: null,
          wikidataId: null,
        },
      ],
      new Set(),
      2
    )
    expect(picked.map((r) => r.id)).toEqual(['2'])
  })
})
