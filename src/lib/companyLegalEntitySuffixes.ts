/**
 * Legal-entity and corporate form tokens stripped when comparing company names.
 * Matching is word-based (split on whitespace); prefer short standalone tokens.
 */
export const LEGAL_ENTITY_SUFFIXES = new Set([
  // English / generic
  'the',
  'and',
  'co',
  'inc',
  'corp',
  'ltd',
  'llc',
  'lp',
  'llp',
  'plc',
  'limited',
  'incorporated',
  'corporation',

  // Sweden / Finland
  'ab',
  'aktiebolag',
  'aktiebolaget',
  'oy',
  'oyj',
  'publ',
  '(publ)',
  '(ab)',

  // Norway / Denmark
  'as',
  'asa',
  'aps',
  'a/s',
  'as/a',
  '(as)',
  '(asa)',

  // Germany / Austria / Switzerland
  'ag',
  'gmbh',
  'kg',
  'ohg',
  'kgaa',
  'ug',
  'gbr',
  'se',
  '(ag)',
  '(gmbh)',

  // France / Belgium / Netherlands / Luxembourg
  'sa',
  'sas',
  'sarl',
  'eurl',
  'bv',
  'nv',
  'sprl',
  'sca',
  'scrl',

  // Spain / Portugal / Italy
  'sl',
  'slu',
  'srl',
  'spa',
  's.p.a',
  'sau',

  // Ireland / UK variants
  'dac',
  'teo',

  // Australia / New Zealand / South Africa
  'pty',

  // Central / Eastern Europe
  'sp',
  'zoo',
  'kft',
  'rt',
  'ood',
  'ead',
  'jsc',
  'cjsc',
  'ojsc',
])

function normalizeWordForSuffixMatch(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[([{]+/, '')
    .replace(/[)\]},.;:]+$/, '')
}

export function isLegalEntitySuffix(word: string): boolean {
  return LEGAL_ENTITY_SUFFIXES.has(normalizeWordForSuffixMatch(word))
}

export function stripLegalEntitySuffixes(name: string): string {
  const stripped = name
    .trim()
    .split(/\s+/)
    .filter((word) => !isLegalEntitySuffix(word))
    .join(' ')
    .trim()
  return stripped || name.trim()
}
