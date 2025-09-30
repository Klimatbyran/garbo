import { Claim, RemoveClaim } from '../src/lib/wikidata/util'
import { removeExistingDuplicates } from '../src/lib/wikidata/edit'

describe('removeExistingDuplicates', () => {
  const baseClaim = {
    value: '+100',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    referenceUrl: 'https://ref.example.com',
    archiveUrl: 'https://archive.example.com',
  }

  it('removes exact duplicates (with different ids) from rmClaims', () => {
    const existingClaims: Claim[] = [
      { ...baseClaim, scope: 'Q1', id: 'C1' },
      { ...baseClaim, scope: 'Q1', id: 'C2' }, // duplicate of C1
    ]
    const rmClaims: RemoveClaim[] = []
    const out = removeExistingDuplicates(existingClaims, rmClaims)
    // One of the two claims should be marked for removal
    expect(out.rmClaims).toHaveLength(1)
    expect(['C1', 'C2']).toContain(out.rmClaims[0].id)
    expect(out.rmClaims[0]).toEqual({ id: out.rmClaims[0].id, remove: true })
  })

  it('does not remove claims when no duplicates exist', () => {
    const existingClaims: Claim[] = [
      { ...baseClaim, scope: 'Q1', id: 'C1' },
      { ...baseClaim, scope: 'Q2', id: 'C2' },
    ]
    const rmClaims: RemoveClaim[] = []
    const out = removeExistingDuplicates(existingClaims, rmClaims)
    expect(out.rmClaims).toEqual([])
  })

  it('does not remove duplicates that are already scheduled for removal', () => {
    const existingClaims: Claim[] = [
      { ...baseClaim, scope: 'Q1', id: 'C1' },
      { ...baseClaim, scope: 'Q1', id: 'C2' }, // duplicate
    ]
    const rmClaims: RemoveClaim[] = [{ id: 'C2', remove: true }]
    const out = removeExistingDuplicates(existingClaims, rmClaims)
    // Only C2 is marked for removal, C1 should not be added
    expect(out.rmClaims).toEqual([{ id: 'C2', remove: true }])
  })

  it('ignores claims without an id', () => {
    const existingClaims: Claim[] = [
      { ...baseClaim, scope: 'Q1', id: undefined },
      { ...baseClaim, scope: 'Q1', id: 'C2' }, // duplicate
    ]
    const rmClaims: RemoveClaim[] = []
    const out = removeExistingDuplicates(existingClaims, rmClaims)
    // only C2 could theoretically be marked for removal, but the one with undefined id should be ignored
    expect(out.rmClaims).toHaveLength(1)
    expect(out.rmClaims[0].id).toBe('C2')
  })

  it('does not remove claims if duplicate already scheduled for removal', () => {
    const existingClaims: Claim[] = [
      { ...baseClaim, scope: 'Q1', id: 'C1' },
      { ...baseClaim, scope: 'Q1', id: 'C2' }, // duplicate
    ]
    const rmClaims: RemoveClaim[] = [{ id: 'C1', remove: true }]
    const out = removeExistingDuplicates(existingClaims, rmClaims)
    // Should only remain with C1 removal, not also add C2
    expect(out.rmClaims).toEqual([{ id: 'C1', remove: true }])
  })
})
