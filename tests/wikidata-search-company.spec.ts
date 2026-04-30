import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../src/lib/wikidata/read'

/**
 * Wikidata entity search used when resolving a company name to a Q-id.
 * These cases hit the live Wikidata API (same as production).
 */

const largeCap: [string, string][] = [
  ['Inter IKEA Group', 'Q54078'],
  ['H&M', 'Q188326'],
  ['Volvo Cars', 'Q215293'],
  ['Ica Gruppen', 'Q1663776'],
  ['NIBE Industrier AB', 'Q10600414'],
]

const smallCap: [string, string][] = [
  ['MOMENT GROUP', 'Q10397256'],
  ['Xspray Pharma', 'Q106640265'],
  ['Sensys Gatso Group AB', 'Q10665716'],
  ['VBG Group', 'Q10711820'],
  ['Infrea', 'Q115167382'],
]

const nonExisting: [string, string][] = []

describe('searchCompany', () => {
  jest.setTimeout(30_000)

  const expectIdInTopResults = async (
    companyName: string,
    expectedId: string
  ) => {
    const results = await searchCompany({ companyName })
    expect(results[0]?.id).toBe(expectedId)
  }

  it.each(largeCap satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s in large cap',
    async (name, id) => {
      await expectIdInTopResults(name, id)
    }
  )

  it.each(smallCap satisfies [string, string][])(
    'resolves "%s" to Wikidata id %s in small cap',
    async (name, id) => {
      await expectIdInTopResults(name, id)
    }
  )
})
