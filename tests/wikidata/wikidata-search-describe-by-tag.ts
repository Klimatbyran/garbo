import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'
import {
  EXPECT_WIKIDATA_ID_IN_TOP,
  expectWikidataIdInTopResults,
} from './wikidata-search-assertions'
import {
  getWikidataLiveTier,
  isWikidataTagIncluded,
  sampleRegularCases,
  shouldRunFringeSearchCases,
  shouldRunRegularSearchCases,
} from './wikidata-live-test-tiers'
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
  wrongWinnerCases?: ReadonlyArray<NamedWikidataCase>
}>

export function defineWikidataSearchTagSpec({
  tag,
  tagLabel,
  specialCases = [],
  emptyResults = [],
  impossibleToFind = [],
  wrongWinnerCases = [],
}: WikidataSearchTagSpecConfig): void {
  const tier = getWikidataLiveTier()

  if (!tier || !isWikidataTagIncluded(tag)) {
    describe.skip(`searchCompany (${tagLabel})`, () => {
      it.todo('not included in current WIKIDATA_LIVE_TESTS tier')
    })
    return
  }

  const regularCases = sampleRegularCases(
    regularCasesForTag(
      tag,
      specialCases,
      emptyResults,
      impossibleToFind,
      wrongWinnerCases
    )
  )

  const willRunRegular =
    shouldRunRegularSearchCases(tag) && regularCases.length > 0
  const willRunFringe =
    shouldRunFringeSearchCases(tag) &&
    (specialCases.length > 0 ||
      emptyResults.length > 0 ||
      impossibleToFind.length > 0 ||
      wrongWinnerCases.length > 0)

  if (!willRunRegular && !willRunFringe) {
    describe.skip(`searchCompany (${tagLabel})`, () => {
      it.todo('no cases for current WIKIDATA_LIVE_TESTS tier')
    })
    return
  }

  describe(`searchCompany (${tagLabel})`, () => {
    jest.setTimeout(60_000)

    if (willRunRegular) {
      it.each(regularCases)(
        `resolves "%s" so Wikidata id %s appears in top ${EXPECT_WIKIDATA_ID_IN_TOP}`,
        async (name, id) => {
          const results = await searchCompany({ companyName: name })
          expectWikidataIdInTopResults(results, id)
        }
      )
    }

    if (willRunFringe && specialCases.length > 0) {
      it.each(specialCases)(
        'special: $companyName — Klimatkollen id $klimatkollenWikidataId in top ' +
          String(EXPECT_WIKIDATA_ID_IN_TOP),
        async ({ companyName, klimatkollenWikidataId }) => {
          const results = await searchCompany({ companyName })
          expectWikidataIdInTopResults(results, klimatkollenWikidataId)
        }
      )
    }

    if (willRunFringe && impossibleToFind.length > 0) {
      it.each(impossibleToFind)(
        'impossible to find: $companyName — Klimatkollen id $klimatkollenWikidataId',
        async ({ companyName, klimatkollenWikidataId }) => {
          const results = await searchCompany({ companyName })
          expect(results).not.toContainEqual(
            expect.objectContaining({ id: klimatkollenWikidataId })
          )
        }
      )
    }

    if (willRunFringe && emptyResults.length > 0) {
      it.each(emptyResults)(
        'returns no hits for $companyName (Klimatkollen $klimatkollenWikidataId)',
        async ({ companyName }) => {
          const results = await searchCompany({ companyName })
          expect(results).toHaveLength(0)
        }
      )
    }

    if (willRunFringe && wrongWinnerCases.length > 0) {
      it.each(wrongWinnerCases)(
        'wrong winner: $companyName — hits exist but not Klimatkollen $klimatkollenWikidataId',
        async ({ companyName, klimatkollenWikidataId }) => {
          const results = await searchCompany({ companyName })
          expect(results.length).toBeGreaterThan(0)
          expect(results.map((r) => r.id)).not.toContain(klimatkollenWikidataId)
        }
      )
    }
  })
}
