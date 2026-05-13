import {
  hashClientApiSecret,
  parseClientApiKey,
  timingSafeEqualHex,
} from './clientApiKeyCrypto'

describe('parseClientApiKey', () => {
  it('parses a valid key', () => {
    const result = parseClientApiKey('garb_mylookup.mysecretpart')
    expect(result).toEqual({
      keyLookup: 'mylookup',
      secretPart: 'mysecretpart',
    })
  })

  it('returns null when the garb_ prefix is missing', () => {
    expect(parseClientApiKey('mylookup.mysecretpart')).toBeNull()
    expect(parseClientApiKey('api_mylookup.mysecretpart')).toBeNull()
  })

  it('returns null when there is no dot separator', () => {
    expect(parseClientApiKey('garb_mylookupnodot')).toBeNull()
  })

  it('returns null when the lookup segment is empty', () => {
    expect(parseClientApiKey('garb_.mysecret')).toBeNull()
  })

  it('returns null when the secret segment is empty', () => {
    expect(parseClientApiKey('garb_mylookup.')).toBeNull()
  })

  it('handles a secret that contains dots (only first dot is the separator)', () => {
    const result = parseClientApiKey('garb_lookup.part1.part2')
    expect(result).toEqual({ keyLookup: 'lookup', secretPart: 'part1.part2' })
  })
})

describe('hashClientApiSecret', () => {
  it('returns a 64-char hex string', () => {
    const hash = hashClientApiSecret('lookup', 'secret', 'pepper')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same inputs produce the same hash', () => {
    const a = hashClientApiSecret('lookup', 'secret', 'pepper')
    const b = hashClientApiSecret('lookup', 'secret', 'pepper')
    expect(a).toBe(b)
  })

  it('changes when any input changes', () => {
    const base = hashClientApiSecret('lookup', 'secret', 'pepper')
    expect(hashClientApiSecret('OTHER', 'secret', 'pepper')).not.toBe(base)
    expect(hashClientApiSecret('lookup', 'OTHER', 'pepper')).not.toBe(base)
    expect(hashClientApiSecret('lookup', 'secret', 'OTHER')).not.toBe(base)
  })
})

describe('timingSafeEqualHex', () => {
  it('returns true for identical hex strings', () => {
    const h = hashClientApiSecret('lookup', 'secret', 'pepper')
    expect(timingSafeEqualHex(h, h)).toBe(true)
  })

  it('returns false for different hex strings of the same length', () => {
    const a = hashClientApiSecret('lookup', 'secret', 'pepper')
    const b = hashClientApiSecret('lookup', 'secret', 'different')
    expect(timingSafeEqualHex(a, b)).toBe(false)
  })

  it('returns false when lengths differ', () => {
    expect(timingSafeEqualHex('aabb', 'aabbcc')).toBe(false)
  })
})
