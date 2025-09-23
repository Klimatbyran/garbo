export const reportedPeriods = [
  {
    year: 1,
    emissions: {
      calculatedTotalEmissions: 7,
      scope3: {
        categories: [
          {
            category: 1,
            total: 6,
          },
        ],
      },
    },
  },
  {
    year: 2,
    emissions: {
      calculatedTotalEmissions: 14,
      scope1: {
        total: 1,
      },
      scope2: {
        mb: 1,
        lb: 1,
        unknown: 0,
      },
      scope3: {
        categories: [
          {
            category: 1,
            total: 12,
          },
        ],
      },
    },
  },
  {
    year: 3,
    emissions: {
      calculatedTotalEmissions: 10,
      scope1: {
        total: 1,
      },
      scope2: {
        mb: 1,
        lb: 1,
        unknown: 0,
      },
      scope3: {
        categories: [
          {
            category: 1,
            total: 8,
          },
        ],
      },
    },
  },
  {
    year: 4,
    emissions: {
      calculatedTotalEmissions: 17,
      scope1: {
        total: 2,
      },
      scope2: {
        mb: 1,
        lb: 1,
        unknown: 0,
      },
      scope3: {
        categories: [
          {
            category: 1,
            total: 14,
          },
        ],
      },
    },
  },
  {
    year: 5,
    emissions: {
      calculatedTotalEmissions: 15,
      scope1: {
        total: 2,
      },
      scope2: {
        mb: 1,
        lb: 1,
        unknown: 0,
      },
      scope3: {
        categories: [
          {
            category: 1,
            total: 12,
          },
        ],
      },
    },
  },
  {
    year: 6,
    emissions: {
      calculatedTotalEmissions: 21,
      scope1: {
        total: 1,
      },
      scope2: {
        mb: 2,
        lb: 2,
        unknown: 0,
      },
      scope3: {
        categories: [
          {
            category: 1,
            total: 18,
          },
        ],
      },
    },
  },
  {
    year: 7,
    emissions: {
      calculatedTotalEmissions: 26,
    },
  },
  {
    year: 8,
    emissions: {
      calculatedTotalEmissions: 23,
    },
  },
]

export const reportingPeriodsWithMixedScopeData = [
  {
    year: 1,
    emissions: {
      calculatedTotalEmissions: 3,
      scope1: { total: 1 },
      scope2: { mb: 1, lb: 1, unknown: 0 },
      scope3: { categories: [{ category: 1, total: 1 }] },
    },
  },
  {
    year: 2,
    emissions: {
      calculatedTotalEmissions: 4,
      scope1: { total: 2 },
      scope2: { mb: 2, lb: 2, unknown: 0 },
    },
  },
  {
    year: 3,
    emissions: {
      calculatedTotalEmissions: 6,
      scope1: { total: 3 },
      scope2: { mb: 3, lb: 3, unknown: 0 },
    },
  },
  {
    year: 4,
    emissions: {
      calculatedTotalEmissions: 8,
      scope1: { total: 4 },
      scope2: { mb: 4, lb: 4, unknown: 0 },
    },
  },
]

export const scope3EmissionsArray = [7, 14, 10, 17, 15, 21]

export const scope1And2EmissionsArray = [4, 6, 8]

export const scope1and2TotalEmissionsArray = [7, 14, 10, 17, 15, 21, 26, 23]

export const aleEmissionsArray = [
  122479.269721, 149847.593565, 137858.649371, 162048.314627, 153825.085295,
  152178.7955, 155980.925217, 162008.760113, 168504.59322, 151960.022899,
  157751.287931, 142529.055614, 136223.552398,
]

export const aleEmissionSlope = -1340.30077

export const aleEmissionTotalTrend = 3.036519e6
