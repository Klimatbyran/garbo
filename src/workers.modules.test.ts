import { describe, it, expect } from '@jest/globals'
import { workers } from './workers'

describe('workers module discovery', () => {
  it('does not register Jest test files as runtime workers', () => {
    const names = workers.map((w) => w.name)
    expect(
      names.some((n) => /test/i.test(n) && n.includes('extractGleif'))
    ).toBe(false)
    expect(names).toContain('extractGleifIds')
    expect(names).not.toContain('extractGleifIds.parent.test')
  })
})
