import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'

/**
 * Wikidata entity search — small-cap cases (live API).
 */

const casesThatPass: [string, string][] = [
  ['Xspray Pharma', 'Q106640265'],
  ['VBG Group', 'Q10711820'],
  ['Infrea', 'Q115167382'],
  ['Precise Biometrics', 'Q30295883'],
  ['IRLAB THERAPEUTICS AB (PUBL)', 'Q106640890'],
  ['Karolinska Development', 'Q30295298'],
]

const specialCases: [string, string][] = [
  ['Anora', 'Q108180696'], // Anora Group
  ['Sensys Gatso Group AB', 'Q10665716'], // Sensys Gatso Group

  /* todo add later
    ['MOMENT GROUP', 'Q10397256'], // Renamed to 2E Group */
]

const casesThatFail: [string, string][] = [
  ['This is a non-existing company', 'Q100000000'],
]

describe('searchCompany (small cap)', () => {
  jest.setTimeout(30_000)

  it.each(casesThatPass satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s',
    async (name, id) => {
      const results = await searchCompany({ companyName: name })
      expect(results[0]?.id).toBe(id)
    }
  )

  it.each(specialCases satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s',
    async (name, id) => {
      const results = await searchCompany({ companyName: name })
      expect(results[0]?.id).toBe(id)
    }
  )

  it.each(casesThatFail satisfies [string, string][])(
    'does not resolve "%s" to Wikidata id',
    async (name) => {
      const results = await searchCompany({ companyName: name })
      expect(results.length).toBe(0)
    }
  )
})
