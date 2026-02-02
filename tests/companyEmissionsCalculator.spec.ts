import { calculateScope3Total } from '../src/lib/company-emissions/companyEmissionsCalculator'

describe('calculateScope3Total', () => {
  it('uses statedTotalEmissions when categories exist but all totals are null/undefined', () => {
    const scope3 = {
      categories: [
        { category: 1, total: null },
        { category: 2 },
        { category: 3, total: undefined },
      ],
      statedTotalEmissions: { total: 133.45 },
    }

    const result = calculateScope3Total(scope3)
    expect(result).toBeCloseTo(133.45)
  })

  it('returns 0 when categories have numeric totals that sum to 0, even if statedTotalEmissions is present', () => {
    const scope3 = {
      categories: [
        { category: 1, total: 0 },
        { category: 2, total: 0 },
      ],
      statedTotalEmissions: { total: 999.99 },
    }

    const result = calculateScope3Total(scope3)
    expect(result).toBe(0)
  })

  it('uses statedTotalEmissions when categories are missing entirely', () => {
    const scope3 = {
      statedTotalEmissions: { total: 42 },
    }

    const result = calculateScope3Total(scope3)
    expect(result).toBe(42)
  })

  it('returns null when neither categories nor statedTotalEmissions exist', () => {
    const scope3 = {}

    const result = calculateScope3Total(scope3)
    expect(result).toBeNull()
  })
})
