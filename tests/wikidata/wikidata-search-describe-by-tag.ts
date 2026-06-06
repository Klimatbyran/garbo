import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'
import {
  EXPECT_WIKIDATA_ID_IN_TOP,
  expectWikidataIdInTopResults,
} from './wikidata-search-assertions'
import {
  type NamedWikidataCase,
  regularCasesForTag,
} from './wikidata-search-helpers'

type WikidataSearchTagSpecConfig = Readonly<{
  tag: string
  tagLabel: string
  specialCases?: ReadonlyArray<NamedWikidataCase>
  emptyResults?: ReadonlyArray<NamedWikidataCase>
  impossibleToFind?: ReadonlyArray<NamedWikidataCase>
}>

export function defineWikidataSearchTagSpec({
  tag,
  tagLabel,
  specialCases = [],
  emptyResults = [],
  impossibleToFind = [],
}: WikidataSearchTagSpecConfig): void {
  const regularCases = regularCasesForTag(
    tag,
    specialCases,
    emptyResults,
    impossibleToFind
  )

  describe(`searchCompany (${tagLabel})`, () => {
    jest.setTimeout(60_000)

    it.each(regularCases)(
      `resolves "%s" so Wikidata id %s appears in top ${EXPECT_WIKIDATA_ID_IN_TOP}`,
      async (name, id) => {
        const results = await searchCompany({ companyName: name })
        expectWikidataIdInTopResults(results, id)
      }
    )

    it.each(specialCases)(
      'special: $companyName — Klimatkollen id $klimatkollenWikidataId in top ' +
        String(EXPECT_WIKIDATA_ID_IN_TOP),
      async ({ companyName, klimatkollenWikidataId }) => {
        const results = await searchCompany({ companyName })
        expectWikidataIdInTopResults(results, klimatkollenWikidataId)
      }
    )

    it.each(impossibleToFind)(
      'impossible to find: $companyName — Klimatkollen id $klimatkollenWikidataId',
      async ({ companyName, klimatkollenWikidataId }) => {
        const results = await searchCompany({ companyName })
        expect(results).not.toContainEqual(
          expect.objectContaining({ id: klimatkollenWikidataId })
        )
      }
    )

    it.each(emptyResults)(
      'returns no hits for $companyName (Klimatkollen $klimatkollenWikidataId)',
      async ({ companyName }) => {
        const results = await searchCompany({ companyName })
        expect(results).toHaveLength(0)
      }
    )
  })
}
