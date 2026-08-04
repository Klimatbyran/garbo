import { describe, expect, it } from '@jest/globals'
import {
  buildLeiPrompt,
  inferPreferSwedishLeiFromUrls,
} from './reportLeiPreference'

describe('inferPreferSwedishLeiFromUrls', () => {
  it('returns true for Swedish report URL hints', () => {
    expect(
      inferPreferSwedishLeiFromUrls([
        'https://example.com/reports/hallbarhetsrapport-2024-sv.pdf',
      ])
    ).toBe(true)
    expect(
      inferPreferSwedishLeiFromUrls(['https://www.company.se/annual-report'])
    ).toBe(true)
  })

  it('returns false for explicit English/global report URLs', () => {
    expect(
      inferPreferSwedishLeiFromUrls([
        'https://www.nestle.com/sites/default/files/2026-02/annual-review-2025-en.pdf',
      ])
    ).toBe(false)
  })

  it('returns false when no locale signal is present', () => {
    expect(
      inferPreferSwedishLeiFromUrls([
        'https://www.nestle.com/sites/default/files/2023-03/sustainability-performance-indicators-2022.pdf',
      ])
    ).toBe(false)
  })
})

describe('buildLeiPrompt', () => {
  it('includes Swedish guidance when requested', () => {
    expect(buildLeiPrompt({ preferSwedishEntities: true })).toContain(
      'Sweden-specific'
    )
  })

  it('discourages Swedish subsidiary bias for group reports by default', () => {
    expect(buildLeiPrompt({ preferSwedishEntities: false })).toContain(
      'ultimate parent'
    )
    expect(buildLeiPrompt({ preferSwedishEntities: false })).not.toContain(
      'Prioritize Swedish'
    )
  })
})
