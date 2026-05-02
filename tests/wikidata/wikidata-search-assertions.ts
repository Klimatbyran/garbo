import { expect } from '@jest/globals'
import type { CompanySearchResult } from '../../src/lib/wikidata/read'

/** Assert Klimatkollen’s id is in the first N ranked hits (not necessarily #1). */
export const EXPECT_WIKIDATA_ID_IN_TOP = 10

export function expectWikidataIdInTopResults(
  results: CompanySearchResult[],
  expectedId: string,
  top = EXPECT_WIKIDATA_ID_IN_TOP
): void {
  const topIds = results.slice(0, top).map((r) => r.id)
  expect(topIds).toContain(expectedId)
}
