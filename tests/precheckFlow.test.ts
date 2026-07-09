import {
  EXTRACT_EMISSIONS_CHILD_QUEUES,
  PRECHECK_SIBLING_QUEUES,
} from '../src/workers/precheckFlow'
import { QUEUE_NAMES } from '../src/queues'

describe('precheck flow structure', () => {
  it('runs guessWikidata as a sibling of extractEmissions', () => {
    expect(PRECHECK_SIBLING_QUEUES).toEqual([
      QUEUE_NAMES.EXTRACT_EMISSIONS,
      QUEUE_NAMES.GUESS_WIKIDATA,
    ])
  })

  it('does not run guessWikidata as a child of extractEmissions', () => {
    expect(EXTRACT_EMISSIONS_CHILD_QUEUES).not.toContain(
      QUEUE_NAMES.GUESS_WIKIDATA
    )
    expect(EXTRACT_EMISSIONS_CHILD_QUEUES).toEqual([
      QUEUE_NAMES.FOLLOW_UP_FISCAL_YEAR,
    ])
  })
})
