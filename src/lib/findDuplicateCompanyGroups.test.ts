import { describe, it, expect } from '@jest/globals'
import { findDuplicateCompanyGroups } from './findDuplicateCompanyGroups'

const company = (
  id: string,
  name: string,
  extras?: { wikidataId?: string | null; lei?: string | null }
) => ({
  id,
  name,
  wikidataId: extras?.wikidataId ?? null,
  lei: extras?.lei ?? null,
  reportingPeriodCount: 0,
  companyReportCount: 0,
})

describe('findDuplicateCompanyGroups', () => {
  it('groups companies with the same normalized name', () => {
    const report = findDuplicateCompanyGroups({
      companies: [
        company('a', 'Alfa Laval AB', { wikidataId: 'Q686030' }),
        company('b', 'Alfa Laval'),
        company('c', 'Other Co'),
      ],
    })

    expect(report.byReason.normalized_name).toBe(1)
    expect(report.companiesInGroups).toBe(2)
    expect(report.groups[0]).toMatchObject({
      reason: 'normalized_name',
      key: 'alfa laval',
      companies: expect.arrayContaining([
        expect.objectContaining({ id: 'a' }),
        expect.objectContaining({ id: 'b' }),
      ]),
    })
  })

  it('groups companies that share an LEI', () => {
    const report = findDuplicateCompanyGroups({
      companies: [
        company('a', 'Acme Holdings', { lei: '5493001KJTIIGC8Y1R12' }),
        company('b', 'Acme Corp'),
      ],
      identifiers: [
        {
          companyId: 'b',
          type: 'LEI',
          value: '5493001KJTIIGC8Y1R12',
        },
      ],
    })

    expect(report.byReason.lei).toBe(1)
    expect(report.groups.some((group) => group.reason === 'lei')).toBe(true)
  })

  it('flags normalized-name groups with conflicting Wikidata ids', () => {
    const report = findDuplicateCompanyGroups({
      companies: [
        company('a', 'Alfa Laval AB', { wikidataId: 'Q686030' }),
        company('b', 'Alfa Laval', { wikidataId: 'Q999999' }),
      ],
    })

    expect(report.byReason.wikidata_conflict).toBe(1)
    expect(
      report.groups.some((group) => group.reason === 'wikidata_conflict')
    ).toBe(true)
  })
})
