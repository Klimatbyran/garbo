import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'

/**
 * Wikidata entity search — large-cap cases (live API).
 */

const casesThatPass: [string, string][] = [
  ['H&M', 'Q188326'],
  ['Volvo Cars', 'Q215293'],
  ['Ica Gruppen', 'Q1663776'],
  ['NIBE Industrier AB', 'Q10600414'],
]

const specialCases: [string, string][] = [
  ['Alimentation Couche-Tard Inc.', 'Q2836957'],
  ['Inter IKEA Group', 'Q47508289'],
]

const casesThatFail: [string, string][] = [
  ['This is a non-existing company', 'Q100000000'],
]

describe('searchCompany (large cap)', () => {
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
