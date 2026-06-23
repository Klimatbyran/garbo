import { z } from 'zod'

import { parseEnvBoolean } from './parseEnvBoolean'

describe('parseEnvBoolean', () => {
  it('is false when unset or empty', () => {
    expect(parseEnvBoolean(undefined)).toBe(false)
    expect(parseEnvBoolean(null)).toBe(false)
    expect(parseEnvBoolean('')).toBe(false)
  })

  it('treats common true tokens as true', () => {
    expect(parseEnvBoolean('true')).toBe(true)
    expect(parseEnvBoolean('TRUE')).toBe(true)
    expect(parseEnvBoolean('1')).toBe(true)
    expect(parseEnvBoolean('yes')).toBe(true)
  })

  it('treats common false tokens as false (not like z.coerce.boolean)', () => {
    expect(parseEnvBoolean('false')).toBe(false)
    expect(parseEnvBoolean('FALSE')).toBe(false)
    expect(parseEnvBoolean('0')).toBe(false)
    expect(parseEnvBoolean('no')).toBe(false)
  })

  it('documents z.coerce.boolean footgun: string "false" becomes true', () => {
    const coerce = z.coerce.boolean()
    expect(coerce.parse('false')).toBe(true)
  })

  it('matches ALLOW_ANONYMOUS_CLIENT_API schema preprocessing', () => {
    const field = z.preprocess(parseEnvBoolean, z.boolean())
    expect(field.parse(undefined)).toBe(false)
    expect(field.parse('false')).toBe(false)
    expect(field.parse('true')).toBe(true)
  })
})
