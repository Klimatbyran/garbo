import { describe, expect, it } from '@jest/globals'
import companyWikidata from '../src/data/klimatkollen-company-wikidata.json'
import {
  companyRegistry,
  lookupRegistryWikidataId,
  wikidataIdFromEntry,
} from '../src/lib/wikidata/companyRegistry'

/**
 * Klimatkollen-assigned Q-ids not yet published on Wikidata.
 * Registry lookup should still return these; live entity fetch may fail until created.
 */
const KLIMATKOLLEN_PENDING_WIKIDATA_IDS: ReadonlyArray<
  readonly [companyName: string, wikidataId: string]
> = [
  ['Acrinova', 'Q138135683'],
  ['B3 Consulting Group', 'Q137909059'],
  ['Berner Industrier AB', 'Q138135718'],
  ['Cinclus Pharma', 'Q134580179'],
  ['Concejo', 'Q138135784'],
  ['EQL Pharma AB', 'Q137399896'],
  ['Fastator', 'Q115168502'],
  ['Hepsor AS', 'Q138573984'],
  ['HKFoods', 'Q139591851'],
  ['Inission AB', 'Q138139493'],
  ['Karnell Group AB', 'Q138140101'],
  ['Mendus', 'Q138140858'],
  ['Nivika', 'Q134691493'],
  ['Nordisk Bergteknik AB', 'Q138141068'],
  ['Oncopeptides', 'Q138144442'],
  ['Pierce Group AB', 'Q138141234'],
  ['PION Group AB', 'Q138141573'],
  ['Seafire', 'Q138143154'],
  ['Sivers Semiconductors', 'Q138143077'],
  ['SLP', 'Q134691531'],
  ['Stockwik', 'Q138142885'],
  ['Swedish Logistic Property', 'Q131426217'],
  ['Vestum', 'Q134691475'],
  ['Vivesto', 'Q138145870'],
  ['Wall to Wall Group AB', 'Q138144224'],
]

describe('companyRegistry data', () => {
  it('has no corrupt null company key', () => {
    expect(Object.prototype.hasOwnProperty.call(companyWikidata, 'null')).toBe(
      false
    )
    expect(lookupRegistryWikidataId('Oncopeptides')).toBe('Q138144442')
  })

  it('uses valid Wikidata id format for every entry', () => {
    for (const [name, entry] of Object.entries(companyRegistry)) {
      const id = wikidataIdFromEntry(entry)
      expect(id).toMatch(/^Q\d+$/)
      expect(name.trim().length).toBeGreaterThan(0)
    }
  })

  it('maps each Klimatkollen pending Wikidata id to the expected company name', () => {
    for (const [companyName, wikidataId] of KLIMATKOLLEN_PENDING_WIKIDATA_IDS) {
      expect(lookupRegistryWikidataId(companyName)).toBe(wikidataId)
    }
  })

  it('has unique company names and wikidata ids', () => {
    const names = Object.keys(companyRegistry)
    const ids = Object.values(companyRegistry).map(wikidataIdFromEntry)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
