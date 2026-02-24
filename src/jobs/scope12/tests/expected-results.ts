// Expected results for different test cases
// Each test file can map to a specific expected result

export const expectedResults = {
  // Default result for most test files

  lundbergs_fastigheter: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 61657,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 7828,
          lb: null,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  coor: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 2196,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 281,
          lb: 188,
          unknown: 280,
          unit: 'tCO2e',
        },
      },
    ],
  },
  bergmanbeving: {
    scope12: [
      {
        year: 2024,
        scope1: null,
        scope1And2: {
          total: 1931,
          unit: 'tCO2e',
        },
        scope2: null,
      },
    ],
  },
  duni: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 16051,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mentionOfLocationBasedOrMarketBased: [
            'Metoden som används för att beräkna scope 2-utsläppen är marknadsbaserad.',
          ],
          explanationOfWhyYouPutValuesToMbOrLbOrUnknown:
            'The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field.',
          mb: 424,
          lb: 12128,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  nibe: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 29977,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 1090,
          lb: 56576,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  powercell: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 6.6,
          unit: 'tCO2',
        },
        scope1And2: null,
        scope2: {
          mb: 40.4,
          lb: 250.5,
          unknown: null,
          unit: 'tCO2',
        },
      },
    ],
  },
  hemnet: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 0,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 0.33,
          unit: 'tCO2e',
        },
      },
    ],
  },
  vitec: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 181.7,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 159,
          lb: 348,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  bico: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 37,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  nivika: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 32,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 680,
          lb: 1302,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },

  eastnine: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 394,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mentionOfLocationBasedOrMarketBased: [
            'Scope 2-utsläpp enligt location-based-metoden: 4 305 ton 2024 (6 007 ton 2023), beräknat automatiskt i ett GHG-beräkningsverktyg baserat på Scope 2-data.',
          ],
          explanationOfWhyYouPutValuesToMbOrLbOrUnknown:
            'The document mentions location-based methodology for Scope 2 emissions, so the values are added to the lb field.',
          mb: null,
          lb: 4305,
          unknown: 1831,
          unit: 'tCO2e',
        },
      },
    ],
  },
  castellum: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 639,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 4946,
          lb: 20516,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  heba: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 1,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 571,
          lb: 1170,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  aqgroup: {
    scope12: [
      {
        absoluteMostRecentYearInReport: 2024,
        year: 2024,
        scope1: null,
        scope1And2: {
          total: 24858,
          unit: 'tCO2e',
        },
        scope2: null,
      },
    ],
  },
  systembolaget: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 5,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 3844,
          lb: 2647,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  swedavia: {
    scope12: [
      {
        absoluteMostRecentYearInReport: 2024,
        year: 2024,
        scope1: null,
        scope1And2: {
          total: 2100,
          unit: 'tCO2e',
        },
        scope2: null,
      },
    ],
  },
  alfalaval: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 16113,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 4817,
          lb: 65086,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  storaenso: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 1170000,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 50000,
          lb: 420000,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  thule: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 3845,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 136,
          lb: 5327,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  lantmannen: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 59600,
          unit: 'tCO2',
        },
        scope1And2: null,
        scope2: {
          mb: 24400,
          lb: null,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  rusta: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 154,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 3344,
          unit: 'tCO2e',
        },
      },
    ],
  },
  catena: {
    scope12: [],
  },
  xvivo: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 61.804,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 92.706,
          unit: 'tCO2e',
        },
      },
    ],
  },
  'svensk-exportkredit': {
    scope12: [
      {
        year: 2024,
        scope1: null,
        scope1And2: null,
        scope2: {
          mb: 19,
          lb: null,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  epiroc: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 30000,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 20000,
          lb: 36000,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  vattenfall: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 3300000,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: 30000,
          lb: 30000,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  scandic: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 3591.1,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 22282.4,
          unit: 'tCO2e',
        },
      },
    ],
  },
  sas: {
    scope12: [
      {
        absoluteMostRecentYearInReport: 2024,
        year: 2024,
        scope1: {
          total: 3171000,
          unit: 'tCO2',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 3000,
          unit: 'tCO2',
        },
      },
    ],
  },
  nyfosa: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 777,
          unit: 'tCO2',
        },
        scope2: {
          mb: null,
          lb: null,
          unknown: 6242,
          unit: 'tCO2',
        },
      },
    ],
  },
  emilshus: {
    scope12: [
      {
        absoluteMostRecentYearInReport: 2024,
        year: 2024,
        scope1: {
          total: 23,
          unit: 'tCO2e',
        },
        scope2: {
          mb: 658,
          lb: 737,
          unknown: null,
          unit: 'tCO2e',
        },
      },
    ],
  },
  rise: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 832,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 1870,
          unit: 'tCO2e',
        },
      },
    ],
  },
  garo: {
    scope12: [
      {
        year: 2024,
        scope1: null,
        scope1And2: {
          total: 690,
          unit: 'tCO2e',
        },
        scope2: null,
      },
    ],
  },
  byggmax: {
    scope12: [
      {
        year: 2024,
        scope1: {
          total: 500,
          unit: 'tCO2e',
        },
        scope1And2: null,
        scope2: {
          mb: null,
          lb: null,
          unknown: 900,
          unit: 'tCO2e',
        },
      },
    ],
  },
}
