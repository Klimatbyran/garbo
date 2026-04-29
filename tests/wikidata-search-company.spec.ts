import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../src/lib/wikidata/read'

/**
 * Wikidata entity search used when resolving a company name to a Q-id.
 * These cases hit the live Wikidata API (same as production).
 */
describe('searchCompany', () => {
  jest.setTimeout(30_000)

  const expectIdInTopResults = async (
    companyName: string,
    expectedId: string,
    withinFirst = 8
  ) => {
    const results = await searchCompany({ companyName })
    expect(results.length).toBeGreaterThan(0)
    const topIds = results.slice(0, withinFirst).map((r) => r.id)
    expect(topIds).toContain(expectedId)
  }

  it.each([
    ['Spotify', 'Q689141'],
    ['IKEA', 'Q54078'],
    ['H&M', 'Q188326'],
    ['Volvo Cars', 'Q215293'],
  ] satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s in top results',
    async (name, id) => {
      await expectIdInTopResults(name, id)
    }
  )
})
