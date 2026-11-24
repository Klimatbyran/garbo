import { describe, it, expect } from '@jest/globals'
import { describePeriodSaveFailure } from './periodSaveFailure'

describe('describePeriodSaveFailure', () => {
  it('returns a compact Error message', () => {
    expect(describePeriodSaveFailure(new Error('boom'))).toBe('boom')
  })

  it('collapses multiline Prisma-style messages and appends the code', () => {
    const err = new Error(
      '\nInvalid `prisma.scope1.create()` invocation:\n\nNull constraint violation on the fields: (`unit`)'
    )
    ;(err as { code?: string }).code = 'P2011'
    expect(describePeriodSaveFailure(err)).toBe(
      'Invalid `prisma.scope1.create()` invocation: Null constraint violation on the fields: (`unit`) [P2011]'
    )
  })

  it('stringifies non-errors', () => {
    expect(describePeriodSaveFailure('disk full')).toBe('disk full')
  })

  it('keeps head and useful tail when the message exceeds 500 chars', () => {
    const head = 'Invalid `prisma.scope1.create()` invocation: '
    const mid = 'x'.repeat(600)
    const tail = 'Null constraint violation on the fields: (`unit`)'
    const err = new Error(head + mid + tail)
    ;(err as { code?: string }).code = 'P2011'
    const out = describePeriodSaveFailure(err)
    expect(out.startsWith(head)).toBe(true)
    expect(out).toContain(' … ')
    expect(out.endsWith(`${tail} [P2011]`)).toBe(true)
    expect(out.length).toBeLessThan(head.length + mid.length + tail.length)
  })
})
