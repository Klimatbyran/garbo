import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'

/**
 * Wikidata entity search — large-cap cases (live API).
 */

const cases: [string, string][] = [
  ['Inter IKEA Group', 'Q54078'],
  ['H&M', 'Q188326'],
  ['Volvo Cars', 'Q215293'],
  ['Ica Gruppen', 'Q1663776'],
  ['NIBE Industrier AB', 'Q10600414'],
]

describe('searchCompany (large cap)', () => {
  jest.setTimeout(30_000)

  it.each(cases satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s',
    async (name, id) => {
      const results = await searchCompany({ companyName: name })
      expect(results[0]?.id).toBe(id)
    }
  )
})
