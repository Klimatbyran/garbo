import { describe, it, expect } from '@jest/globals'
import {
  gleifRecordsToLeiCandidates,
  isLeiAmongGleifCandidates,
  acceptLeiFromGleifCandidates,
} from './gleif'

/** Valid LEIs (mod-97) for tests. */
const ENTITY_LEI = '5493001KJTIIGC8Y1R12'
const MANAGING_LOU = '335800FVH4MOKZS9VH40'

describe('gleifRecordsToLeiCandidates', () => {
  it('maps entity lei/legalName/jurisdiction and drops managingLou', () => {
    const candidates = gleifRecordsToLeiCandidates([
      {
        attributes: {
          lei: ENTITY_LEI,
          entity: {
            legalName: { name: 'Example AB', language: 'en' },
            jurisdiction: 'SE',
          },
          registration: {
            managingLou: MANAGING_LOU,
          },
        },
      },
    ])

    expect(candidates).toEqual([
      {
        lei: ENTITY_LEI,
        legalName: 'Example AB',
        jurisdiction: 'SE',
      },
    ])
    expect(JSON.stringify(candidates)).not.toContain('managingLou')
    expect(JSON.stringify(candidates)).not.toContain(MANAGING_LOU)
  })

  it('skips records with invalid lei or missing legal name', () => {
    expect(
      gleifRecordsToLeiCandidates([
        {
          attributes: {
            lei: 'not-a-lei',
            entity: { legalName: { name: 'Bad' } },
          },
        },
        {
          attributes: {
            lei: ENTITY_LEI,
            entity: { legalName: { name: '  ' } },
          },
        },
      ])
    ).toEqual([])
  })
})

describe('isLeiAmongGleifCandidates', () => {
  const candidates = [
    {
      lei: ENTITY_LEI,
      legalName: 'Example AB',
      jurisdiction: 'SE',
    },
  ]

  it('accepts the entity LEI from candidates', () => {
    expect(isLeiAmongGleifCandidates(ENTITY_LEI, candidates)).toBe(true)
    expect(
      isLeiAmongGleifCandidates(ENTITY_LEI.toLowerCase(), candidates)
    ).toBe(true)
  })

  it('rejects managingLou and unknown LEIs', () => {
    expect(isLeiAmongGleifCandidates(MANAGING_LOU, candidates)).toBe(false)
    expect(isLeiAmongGleifCandidates('5493001KJTIIGC8Y1R13', candidates)).toBe(
      false
    )
  })
})

describe('acceptLeiFromGleifCandidates', () => {
  const candidates = [
    {
      lei: ENTITY_LEI,
      legalName: 'Example AB',
      jurisdiction: 'SE',
    },
  ]

  it('returns the entity LEI when selected', () => {
    const logs: string[] = []
    expect(
      acceptLeiFromGleifCandidates(ENTITY_LEI, candidates, (message) =>
        logs.push(message)
      )
    ).toBe(ENTITY_LEI)
    expect(logs).toEqual([])
  })

  it('rejects managingLou even when checksum-valid', () => {
    const logs: string[] = []
    expect(
      acceptLeiFromGleifCandidates(MANAGING_LOU, candidates, (message) =>
        logs.push(message)
      )
    ).toBeUndefined()
    expect(logs.join('\n')).toMatch(/not in the GLEIF entity candidate list/)
  })
})
