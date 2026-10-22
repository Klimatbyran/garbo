import { describe, it, expect } from '@jest/globals'
import {
  MAX_AUTO_ISINS,
  IDENTIFIER_BATCH_MAX_ITEMS,
  chunkIdentifierWriteItems,
  planGleifIdentifierWrites,
} from './gleifIdentifierWrite'

const ISIN_A = 'SE0000108656'
const ISIN_B = 'DE0006047004'
const BIC_A = 'TEERSESSXXX'

describe('planGleifIdentifierWrites', () => {
  it('writes all ISINs under the cap without PRIMARY when multiple', () => {
    const plan = planGleifIdentifierWrites({
      existing: [],
      isins: [ISIN_A, ISIN_B],
      isinTotal: 2,
      isinsTruncated: false,
      registeredAs: '556016-0680',
      bics: [BIC_A],
    })
    expect(plan.items.filter((i) => i.type === 'ISIN')).toEqual([
      { type: 'ISIN', value: ISIN_A },
      { type: 'ISIN', value: ISIN_B },
    ])
    expect(plan.items).toContainEqual({
      type: 'ORG_NUMBER',
      value: '556016-0680',
    })
    expect(plan.items).toContainEqual({
      type: 'BIC',
      value: BIC_A,
      role: 'PRIMARY',
    })
  })

  it('sets PRIMARY when exactly one ISIN', () => {
    const plan = planGleifIdentifierWrites({
      existing: [],
      isins: [ISIN_A],
      isinTotal: 1,
      isinsTruncated: false,
      registeredAs: null,
      bics: [],
    })
    expect(plan.items).toEqual([
      { type: 'ISIN', value: ISIN_A, role: 'PRIMARY' },
    ])
  })

  it('skips ISIN write when over cap or truncated', () => {
    const plan = planGleifIdentifierWrites({
      existing: [],
      isins: [ISIN_A],
      isinTotal: MAX_AUTO_ISINS + 1,
      isinsTruncated: true,
      registeredAs: null,
      bics: [],
    })
    expect(plan.items.filter((i) => i.type === 'ISIN')).toEqual([])
  })

  it('does not overwrite existing ORG_NUMBER or duplicate values', () => {
    const plan = planGleifIdentifierWrites({
      existing: [
        { type: 'ORG_NUMBER', value: '111' },
        { type: 'ISIN', value: ISIN_A, role: 'PRIMARY' },
      ],
      isins: [ISIN_A, ISIN_B],
      isinTotal: 2,
      isinsTruncated: false,
      registeredAs: '222',
      bics: [],
    })
    expect(plan.items.find((i) => i.type === 'ORG_NUMBER')).toBeUndefined()
    expect(plan.items).toEqual([{ type: 'ISIN', value: ISIN_B }])
  })

  it('promotes an existing sole ISIN to PRIMARY when GLEIF confirms it', () => {
    const plan = planGleifIdentifierWrites({
      existing: [{ type: 'ISIN', value: ISIN_A }],
      isins: [ISIN_A],
      isinTotal: 1,
      isinsTruncated: false,
      registeredAs: null,
      bics: [],
    })
    expect(plan.items).toEqual([
      { type: 'ISIN', value: ISIN_A, role: 'PRIMARY' },
    ])
  })

  it('chunks writes under the API batch max', () => {
    const items = Array.from(
      { length: IDENTIFIER_BATCH_MAX_ITEMS + 2 },
      (_, i) => ({
        type: 'ISIN' as const,
        value: `item-${i}`,
      })
    )
    const chunks = chunkIdentifierWriteItems(items)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(IDENTIFIER_BATCH_MAX_ITEMS)
    expect(chunks[1]).toHaveLength(2)
  })
})
