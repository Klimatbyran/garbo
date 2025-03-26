import { addCalculatedTotalEmissions, calculateScope2Total, calculateScope3Total, calculateTotalEmissions } from '../companyService'

describe('Emissions calculations', () => {
  describe('calculateScope2Total', () => {
    it('should return market-based value when available', () => {
      const scope2 = { mb: 100, lb: 50, unknown: 25 }
      expect(calculateScope2Total(scope2)).toBe(100)
    })

    it('should fall back to location-based value when market-based is not available', () => {
      const scope2 = { lb: 50, unknown: 25 }
      expect(calculateScope2Total(scope2)).toBe(50)
    })

    it('should fall back to unknown value when others are not available', () => {
      const scope2 = { unknown: 25 }
      expect(calculateScope2Total(scope2)).toBe(25)
    })

    it('should return 0 when no values are available', () => {
      const scope2 = {}
      expect(calculateScope2Total(scope2)).toBe(0)
    })
  })

  describe('calculateScope3Total', () => {
    it('should sum verified categories when some categories have verification', () => {
      const scope3 = {
        categories: [
          { category: 1, total: 100, metadata: { verifiedBy: 'Someone' } },
          { category: 2, total: 200, metadata: { verifiedBy: null } },
          { category: 16, total: 300, metadata: { verifiedBy: null } } // Category 16 without verification should be excluded
        ],
        statedTotalEmissions: { total: 1000 }
      }
      expect(calculateScope3Total(scope3)).toBe(100) // Only category 1 is counted
    })

    it('should include category 16 when it has verification', () => {
      const scope3 = {
        categories: [
          { category: 1, total: 100, metadata: { verifiedBy: 'Someone' } },
          { category: 16, total: 300, metadata: { verifiedBy: 'Someone' } }
        ],
        statedTotalEmissions: { total: 1000 }
      }
      expect(calculateScope3Total(scope3)).toBe(400) // Both categories are counted
    })

    it('should use statedTotalEmissions when no categories have verification', () => {
      const scope3 = {
        categories: [
          { category: 1, total: 100, metadata: { verifiedBy: null } },
          { category: 2, total: 200, metadata: { verifiedBy: null } }
        ],
        statedTotalEmissions: { total: 1000 }
      }
      expect(calculateScope3Total(scope3)).toBe(1000)
    })

    it('should return 0 when no data is available', () => {
      const scope3 = {
        categories: [],
        statedTotalEmissions: null
      }
      expect(calculateScope3Total(scope3)).toBe(0)
    })

    it('should handle non-numeric values in category totals', () => {
      const scope3 = {
        categories: [
          { category: 1, total: 100, metadata: { verifiedBy: 'Someone' } },
          { category: 2, total: null, metadata: { verifiedBy: 'Someone' } },
          { category: 3, total: undefined, metadata: { verifiedBy: 'Someone' } },
          { category: 4, total: 'not a number', metadata: { verifiedBy: 'Someone' } }
        ],
        statedTotalEmissions: { total: 1000 }
      }
      expect(calculateScope3Total(scope3)).toBe(100) // Only the valid number is counted
    })
  })

  describe('calculateTotalEmissions', () => {
    it('should use individual scope1 and scope2 totals when either has verification', () => {
      const scope1 = { total: 100, metadata: { verifiedBy: 'Someone' } }
      const scope2 = { calculatedTotalEmissions: 200, metadata: { verifiedBy: null } }
      const scope3 = { calculatedTotalEmissions: 300 }
      const scope1And2 = { total: 500 }
      
      expect(calculateTotalEmissions(scope1, scope2, scope3, scope1And2)).toBe(600) // 100 + 200 + 300
    })

    it('should use scope1And2 when neither scope1 nor scope2 has verification', () => {
      const scope1 = { total: 100, metadata: { verifiedBy: null } }
      const scope2 = { calculatedTotalEmissions: 200, metadata: { verifiedBy: null } }
      const scope3 = { calculatedTotalEmissions: 300 }
      const scope1And2 = { total: 500 }
      
      expect(calculateTotalEmissions(scope1, scope2, scope3, scope1And2)).toBe(800) // 500 + 300
    })

    it('should handle missing scope data', () => {
      expect(calculateTotalEmissions(null, null, null, null)).toBe(0)
      expect(calculateTotalEmissions(
        { total: 100, metadata: { verifiedBy: 'Someone' } }, 
        null, 
        null, 
        null
      )).toBe(100)
    })
  })

  describe('addCalculatedTotalEmissions', () => {
    it('should handle companies with no reporting periods', () => {
      const companies = [{ name: 'Company A', reportingPeriods: [] }]
      const result = addCalculatedTotalEmissions(companies)
      expect(result).toEqual(companies)
    })

    it('should handle reporting periods with no emissions data', () => {
      const companies = [{
        name: 'Company A',
        reportingPeriods: [
          { year: 2022, emissions: null, metadata: { id: '1' } }
        ]
      }]
      const result = addCalculatedTotalEmissions(companies)
      expect(result[0].reportingPeriods[0].emissions).toBeNull()
    })

    it('should calculate emissions for a complete dataset', () => {
      const companies = [{
        name: 'Company A',
        reportingPeriods: [{
          year: 2022,
          emissions: {
            scope1: { total: 100, metadata: { verifiedBy: 'Someone' } },
            scope2: { mb: 200, lb: 250, metadata: { verifiedBy: 'Someone' } },
            scope3: {
              categories: [
                { category: 1, total: 300, metadata: { verifiedBy: 'Someone' } },
                { category: 2, total: 400, metadata: { verifiedBy: 'Someone' } }
              ],
              statedTotalEmissions: { total: 800 }
            },
            scope1And2: { total: 350 }
          },
          metadata: { id: '1' }
        }]
      }]
      
      const result = addCalculatedTotalEmissions(companies)
      
      // Scope2 total should be market-based value
      expect(result[0].reportingPeriods[0].emissions.scope2.calculatedTotalEmissions).toBe(200)
      
      // Scope3 total should be sum of verified categories
      expect(result[0].reportingPeriods[0].emissions.scope3.calculatedTotalEmissions).toBe(700)
      
      // Total emissions should be scope1 + scope2 + scope3
      expect(result[0].reportingPeriods[0].emissions.calculatedTotalEmissions).toBe(1000)
    })

    it('should handle complex mixed verification scenarios', () => {
      const companies = [{
        name: 'Company A',
        reportingPeriods: [{
          year: 2022,
          emissions: {
            scope1: { total: 100, metadata: { verifiedBy: null } },
            scope2: { mb: 200, lb: 250, metadata: { verifiedBy: null } },
            scope3: {
              categories: [
                { category: 1, total: 300, metadata: { verifiedBy: null } },
                { category: 2, total: 400, metadata: { verifiedBy: null } }
              ],
              statedTotalEmissions: { total: 800 }
            },
            scope1And2: { total: 350 }
          },
          metadata: { id: '1' }
        }]
      }]
      
      const result = addCalculatedTotalEmissions(companies)
      
      // Should use scope1And2 total since neither scope1 nor scope2 has verification
      // And should use statedTotalEmissions for scope3 since no categories have verification
      expect(result[0].reportingPeriods[0].emissions.calculatedTotalEmissions).toBe(1150) // 350 + 800
    })
  })
})
