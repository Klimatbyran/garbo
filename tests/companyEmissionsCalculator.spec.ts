import {
  calculateScope3Total,
  calculatedTotalEmissions,
} from '../src/lib/company-emissions/companyEmissionsCalculator'

describe('calculatedTotalEmissions', () => {
  it('falls back to combined statedTotalEmissions when no scope 1, 1+2, 2 or 3 emissions', () => {
    const emissions = {
      statedTotalEmissions: { total: 500, unit: 'tCO2e' },
    }
    expect(calculatedTotalEmissions(emissions)).toBe(500)
  })

  it('returns null when no scope emissions and no statedTotalEmissions', () => {
    expect(calculatedTotalEmissions({})).toBeNull()
  })

  it('returns null when no scope emissions and statedTotalEmissions.total is null', () => {
    expect(
      calculatedTotalEmissions({
        statedTotalEmissions: { total: null, unit: 'tCO2e' },
      })
    ).toBeNull()
  })
})

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
