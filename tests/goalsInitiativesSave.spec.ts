import {
  filterByReportId,
  goalsInitiativesSaveExtras,
  stripGoalInitiativeDiffNoise,
} from '../src/lib/goalsInitiativesSave'

describe('goalsInitiativesSave', () => {
  it('filters rows by reportId and leaves orphans when no reportId', () => {
    const rows = [
      { id: '1', reportId: 'r1', description: 'a' },
      { id: '2', reportId: null, description: 'b' },
      { id: '3', reportId: 'r2', description: 'c' },
    ]
    expect(filterByReportId(rows, 'r1')).toEqual([rows[0]])
    expect(filterByReportId(rows, undefined)).toEqual(rows)
  })

  it('strips id/metadata/reportId for LLM diffs', () => {
    expect(
      stripGoalInitiativeDiffNoise([
        {
          id: '1',
          reportId: 'r1',
          metadata: { comment: 'x' },
          description: 'Reduce',
        },
      ])
    ).toEqual([{ description: 'Reduce' }])
  })

  it('builds save extras from registry report + pdf cache', () => {
    expect(
      goalsInitiativesSaveExtras({
        registryReportId: 'rep-1',
        pdfCache: { publicUrl: 'https://storage.example/a.pdf' },
      })
    ).toEqual({
      reportId: 'rep-1',
      reportS3Url: 'https://storage.example/a.pdf',
    })
  })
})
