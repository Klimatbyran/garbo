import { describe, expect, it } from '@jest/globals'
import {
  isPlaceholderCompanyName,
  sanitizeExtractedCompanyName,
} from './companyNamePlaceholders'

describe('isPlaceholderCompanyName', () => {
  it('treats null, empty, and known placeholders as placeholders', () => {
    expect(isPlaceholderCompanyName(null)).toBe(true)
    expect(isPlaceholderCompanyName(undefined)).toBe(true)
    expect(isPlaceholderCompanyName('')).toBe(true)
    expect(isPlaceholderCompanyName('   ')).toBe(true)
    expect(isPlaceholderCompanyName('null')).toBe(true)
    expect(isPlaceholderCompanyName('NULL')).toBe(true)
    expect(isPlaceholderCompanyName(' Unknown ')).toBe(true)
    expect(isPlaceholderCompanyName('n/a')).toBe(true)
    expect(isPlaceholderCompanyName('undefined')).toBe(true)
  })

  it('accepts real company names', () => {
    expect(isPlaceholderCompanyName('Alfa Laval AB')).toBe(false)
    expect(isPlaceholderCompanyName('Nullarbor Holdings')).toBe(false)
  })
})

describe('sanitizeExtractedCompanyName', () => {
  it('returns trimmed names and maps placeholders to null', () => {
    expect(sanitizeExtractedCompanyName('  Volvo AB  ')).toBe('Volvo AB')
    expect(sanitizeExtractedCompanyName('null')).toBeNull()
    expect(sanitizeExtractedCompanyName('Unknown')).toBeNull()
    expect(sanitizeExtractedCompanyName(null)).toBeNull()
  })
})
