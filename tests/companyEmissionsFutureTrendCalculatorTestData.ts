import { ReportedPeriod } from '../src/lib/company-emissions/companyEmissionsFutureTrendCalculator'

export const reportedPeriodWithScope3Data = {
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
}

export const reportedPeriodWithoutScope3Data = {
  year: 7,
  emissions: {
    calculatedTotalEmissions: 26,
  },
}

export const reportedPeriods = [
  reportedPeriodWithScope3Data,
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
  reportedPeriodWithoutScope3Data,
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

export const reportingPeriodWithoutScope1And2Data = {
  year: 7,
  emissions: {
    calculatedTotalEmissions: 26,
  },
}

export const scope3EmissionsArray = [
  { year: 1, emissions: 7 },
  { year: 2, emissions: 14 },
  { year: 3, emissions: 10 },
  { year: 4, emissions: 17 },
  { year: 5, emissions: 15 },
  { year: 6, emissions: 21 },
]

export const scope1And2EmissionsArray = [
  { year: 2, emissions: 4 },
  { year: 3, emissions: 6 },
  { year: 4, emissions: 8 },
]

export const scope1and2TotalEmissionsArray = [
  { year: 1, emissions: 7 },
  { year: 2, emissions: 14 },
  { year: 3, emissions: 10 },
  { year: 4, emissions: 17 },
  { year: 5, emissions: 15 },
  { year: 6, emissions: 21 },
  { year: 7, emissions: 26 },
  { year: 8, emissions: 23 },
]

// municipality emissions data to compare model result with municipality model in python
export const aleEmissionsArray = [
  { year: 2015, emissions: 153825.085295 },
  { year: 2016, emissions: 152178.7955 },
  { year: 2017, emissions: 155980.925217 },
  { year: 2018, emissions: 162008.760113 },
  { year: 2019, emissions: 168504.59322 },
  { year: 2020, emissions: 151960.022899 },
  { year: 2021, emissions: 157751.287931 },
  { year: 2022, emissions: 142529.055614 },
  { year: 2023, emissions: 136223.552398 },
]

export const aleEmissionSlope = -1340.3

export const kirunaEmissionsArray = [
  { year: 2015, emissions: 697942.32 },
  { year: 2016, emissions: 729473.19 },
  { year: 2017, emissions: 731176.2 },
  { year: 2018, emissions: 717595.47 },
  { year: 2019, emissions: 730901.91 },
  { year: 2020, emissions: 721544.76 },
  { year: 2021, emissions: 698619.98 },
  { year: 2022, emissions: 690283.05 },
  { year: 2023, emissions: 687670.88 },
]

export const kirunaEmissionSlope = -5979.78

// company data for Svevia
export const sveviaEmissions: ReportedPeriod[] = [
  {
    year: 2024,
    emissions: {
      calculatedTotalEmissions: 38645,
      scope1: { total: 29149 },
      scope2: { mb: 4719, lb: 798, unknown: null },
      scope3: {
        calculatedTotalEmissions: 4777,
        statedTotalEmissions: { total: 4777 },
        categories: [
          { category: 5, total: null },
          { category: 6, total: null },
        ],
      },
      statedTotalEmissions: null,
    },
  },
  {
    year: 2023,
    emissions: {
      calculatedTotalEmissions: 31078,
      scope1: { total: 22741 },
      scope2: { mb: 3315, lb: 800, unknown: null },
      scope3: {
        calculatedTotalEmissions: 5022,
        statedTotalEmissions: { total: 5022 },
        categories: [],
      },
      statedTotalEmissions: null,
    },
  },
  {
    year: 2022,
    emissions: {
      calculatedTotalEmissions: 36972,
      scope1: { total: 28163 },
      scope2: { mb: 3982, lb: 683, unknown: null },
      scope3: {
        calculatedTotalEmissions: 4827,
        statedTotalEmissions: { total: 4827 },
        categories: [],
      },
      statedTotalEmissions: null,
    },
  },
  {
    year: 2021,
    emissions: {
      calculatedTotalEmissions: 29395,
      scope1: { total: 24876 },
      scope2: { mb: 3530, lb: 706, unknown: null },
      scope3: {
        calculatedTotalEmissions: 989,
        statedTotalEmissions: { total: 989 },
        categories: [],
      },
      statedTotalEmissions: null,
    },
  },
  {
    year: 2020,
    emissions: {
      calculatedTotalEmissions: 27964,
      scope1: { total: 24103 },
      scope2: { mb: 3626, lb: 958, unknown: null },
      scope3: {
        calculatedTotalEmissions: 235,
        statedTotalEmissions: { total: 235 },
        categories: [],
      },
      statedTotalEmissions: null,
    },
  },
  {
    year: 2019,
    emissions: {
      calculatedTotalEmissions: 25084,
      scope1: { total: 25084 },
      scope2: null,
      scope3: {
        calculatedTotalEmissions: 0,
        statedTotalEmissions: { total: null },
        categories: [],
      },
      statedTotalEmissions: null,
    },
  },
  {
    year: 2015,
    emissions: {
      calculatedTotalEmissions: 37008,
      scope1: { total: 32395 },
      scope2: { mb: 4613, lb: 1007, unknown: null },
      scope3: {
        calculatedTotalEmissions: 0,
        statedTotalEmissions: { total: null },
        categories: [],
      },
      statedTotalEmissions: null,
    },
  },
]

export const sveviaEmissionsArray = [
  { year: 2020, emissions: 27964 },
  { year: 2021, emissions: 29395 },
  { year: 2022, emissions: 36972 },
  { year: 2023, emissions: 31078 },
  { year: 2024, emissions: 38645 },
]

export const sveviaEmissionSlope = 2670.25

export const sveviaLastPeriod = sveviaEmissions[sveviaEmissions.length - 1]

export const sveviaEmissionsWithNull: ReportedPeriod[] = sveviaEmissions.map(
  (period) => (period.year === 2021 ? { ...period, emissions: null } : period),
)

export const hanzaPeriod = {
  year: 2023,
  emissions: {
    calculatedTotalEmissions: 5200,
    scope1: { total: 2300 },
    scope2: { mb: 1100, lb: 600, unknown: null },
    scope3: {
      calculatedTotalEmissions: 0,
      statedTotalEmissions: { total: 0 },
      categories: [
        { category: 1, total: null },
        { category: 5, total: 0 },
      ],
    },
  },
}

// Edge case test data
export const zeroEmissionsData = [
  { year: 2020, emissions: 0 },
  { year: 2021, emissions: 0 },
  { year: 2022, emissions: 0 },
  { year: 2023, emissions: 0 },
]

export const identicalEmissionsData = [
  { year: 2020, emissions: 100 },
  { year: 2021, emissions: 100 },
  { year: 2022, emissions: 100 },
  { year: 2023, emissions: 100 },
]

export const extremeOutlierData = [
  { year: 2020, emissions: 100 },
  { year: 2021, emissions: 120 },
  { year: 2022, emissions: 110 },
  { year: 2023, emissions: 1000000 }, // Extreme outlier
]

export const nanEmissionsData = [
  { year: 2020, emissions: 100 },
  { year: 2021, emissions: NaN },
  { year: 2022, emissions: 200 },
  { year: 2023, emissions: 150 },
]

export const insufficientDataAfterBaseYear = [
  { year: 2020, emissions: 100 },
  { year: 2021, emissions: 120 },
  { year: 2022, emissions: 110 },
  { year: 2023, emissions: 130 },
  { year: 2024, emissions: 125 },
]

export const baseYearNotFoundData = [
  { year: 2020, emissions: 100 },
  { year: 2021, emissions: 120 },
  { year: 2022, emissions: 110 },
]

export const scope3OnlyStatedTotalData = {
  year: 2020,
  emissions: {
    calculatedTotalEmissions: 100,
    scope3: {
      statedTotalEmissions: { total: 100 },
      categories: [],
    },
  },
}

export const scope3EmptyCategoriesData = {
  year: 2020,
  emissions: {
    calculatedTotalEmissions: 100,
    scope3: {
      statedTotalEmissions: { total: null },
      categories: [],
    },
  },
}

export const scope2OnlyUnknownData = {
  year: 2020,
  emissions: {
    calculatedTotalEmissions: 100,
    scope1: { total: 50 },
    scope2: { mb: undefined, lb: 0, unknown: 50 },
  },
}

export const scope1ZeroData = {
  year: 2020,
  emissions: {
    calculatedTotalEmissions: 100,
    scope1: { total: 0 },
    scope2: { mb: 50, lb: 50, unknown: null },
  },
}

// Test data for base year filtering
export const baseYearTestData: ReportedPeriod[] = [
  {
    year: 2018,
    emissions: {
      calculatedTotalEmissions: 1000,
      scope1: { total: 500 },
      scope2: { mb: 300, lb: 200, unknown: null },
    },
  },
  {
    year: 2019,
    emissions: {
      calculatedTotalEmissions: 1100,
      scope1: { total: 550 },
      scope2: { mb: 330, lb: 220, unknown: null },
    },
  },
  {
    year: 2020,
    emissions: {
      calculatedTotalEmissions: 1200,
      scope1: { total: 600 },
      scope2: { mb: 360, lb: 240, unknown: null },
    },
  },
  {
    year: 2021,
    emissions: {
      calculatedTotalEmissions: 1300,
      scope1: { total: 650 },
      scope2: { mb: 390, lb: 260, unknown: null },
    },
  },
  {
    year: 2022,
    emissions: {
      calculatedTotalEmissions: 1400,
      scope1: { total: 700 },
      scope2: { mb: 420, lb: 280, unknown: null },
    },
  },
]
