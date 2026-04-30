import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'

/**
 * Wikidata entity search — small-cap cases (live API).
 */

const cases: [string, string][] = [
  ['Anora', 'Q108180696'],
  ['Xspray Pharma', 'Q106640265'],
  ['Sensys Gatso Group AB', 'Q10665716'],
  ['VBG Group', 'Q10711820'],
  ['Infrea', 'Q115167382'],
]

describe('searchCompany (small cap)', () => {
  jest.setTimeout(30_000)

  it.each(cases satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s',
    async (name, id) => {
      const results = await searchCompany({ companyName: name })
      expect(results[0]?.id).toBe(id)
    }
  )
})
