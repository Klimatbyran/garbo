import type { NamedWikidataCase } from './wikidata-search-helpers'
import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

const BALTICS_SEARCH_SPECIAL_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'IKI', klimatkollenWikidataId: 'Q1653981' },
]

const BALTICS_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'AB Akola Group', klimatkollenWikidataId: 'Q131825039' },
  { companyName: 'AB KN ENERGIES', klimatkollenWikidataId: 'Q4042253' },
  { companyName: 'AB Pieno žvaigždės', klimatkollenWikidataId: 'Q2092661' },
  { companyName: 'Aktsiaselts Infortar', klimatkollenWikidataId: 'Q25517692' },
  { companyName: 'APB Apranga', klimatkollenWikidataId: 'Q1974912' },
  { companyName: 'AS Ekspress Grupp', klimatkollenWikidataId: 'Q11000563' },
  { companyName: 'AS Pro Kapital Grupp', klimatkollenWikidataId: 'Q25514660' },
  { companyName: 'Bolt Operations OÜ', klimatkollenWikidataId: 'Q20529164' },
  { companyName: 'Coop Pank AS', klimatkollenWikidataId: 'Q11220382' },
  {
    companyName: 'EfTEN Real Estate Fund AS',
    klimatkollenWikidataId: 'Q106618620',
  },
  { companyName: 'Grigeo Group AB', klimatkollenWikidataId: 'Q1974994' },
  { companyName: 'Harju Elekter Group', klimatkollenWikidataId: 'Q1976140' },
  { companyName: 'Hepsor AS', klimatkollenWikidataId: 'Q138573984' },
  { companyName: 'NOVATURAS AB', klimatkollenWikidataId: 'Q12667050' },
  { companyName: 'Olvi Group', klimatkollenWikidataId: 'Q4045735' },
  { companyName: 'Rokiškio sūris AB', klimatkollenWikidataId: 'Q2162597' },
  { companyName: 'Šiaulių Bankas Group', klimatkollenWikidataId: 'Q391518' },
  { companyName: 'VILVI Group', klimatkollenWikidataId: 'Q4052700' },
]

defineWikidataSearchTagSpec({
  tag: 'baltics',
  tagLabel: 'baltics',
  specialCases: BALTICS_SEARCH_SPECIAL_CASES,
  emptyResults: BALTICS_SEARCH_EMPTY_RESULTS,
})
