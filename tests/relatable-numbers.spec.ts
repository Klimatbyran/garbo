import { addRelatableNumbers } from '../src/api/services/companyService';

describe('Relatable Numbers Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should calculate CO2 per million revenue when both emissions and turnover are present', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000, // 1000 tCO2e
            },
            economy: {
              turnover: {
                value: 500000000, // 500 million SEK
                currency: 'SEK',
              },
              employees: {
                value: 100,
                unit: 'FTE',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers).toBeDefined();
    // CO2 per million revenue: (1000 / 500000000) * 1000000 = 2
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeCloseTo(2, 5);
    // CO2 per employee: 1000 / 100 = 10
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeCloseTo(10, 5);
  });

  test('should return null for CO2 per million revenue when turnover is zero', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000,
            },
            economy: {
              turnover: {
                value: 0,
                currency: 'SEK',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeNull();
  });

  test('should return null for CO2 per employee when employees is zero', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000,
            },
            economy: {
              employees: {
                value: 0,
                unit: 'FTE',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeNull();
  });

  test('should return null for both metrics when emissions data is missing', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: null,
            economy: {
              turnover: {
                value: 500000000,
                currency: 'SEK',
              },
              employees: {
                value: 100,
                unit: 'FTE',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeNull();
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeNull();
  });

  test('should return null for both metrics when economy data is missing', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000,
            },
            economy: null,
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeNull();
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeNull();
  });

  test('should handle multiple reporting periods correctly', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000,
            },
            economy: {
              turnover: {
                value: 500000000,
                currency: 'SEK',
              },
              employees: {
                value: 100,
                unit: 'FTE',
              },
            },
          },
          {
            id: 'rp2',
            year: '2022',
            emissions: {
              calculatedTotalEmissions: 1200,
            },
            economy: {
              turnover: {
                value: 480000000,
                currency: 'SEK',
              },
              employees: {
                value: 95,
                unit: 'FTE',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    // First period: (1000 / 500000000) * 1000000 = 2
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeCloseTo(2, 5);
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeCloseTo(10, 5);

    // Second period: (1200 / 480000000) * 1000000 = 2.5
    expect(result[0].reportingPeriods[1].relatableNumbers.co2PerMillionRevenue).toBeCloseTo(2.5, 5);
    expect(result[0].reportingPeriods[1].relatableNumbers.co2PerEmployee).toBeCloseTo(12.631578947368421, 5);
  });

  test('should handle partial economy data - only turnover', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000,
            },
            economy: {
              turnover: {
                value: 500000000,
                currency: 'SEK',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeCloseTo(2, 5);
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeNull();
  });

  test('should handle partial economy data - only employees', () => {
    const companies = [
      {
        wikidataId: 'Q123',
        name: 'Test Company',
        reportingPeriods: [
          {
            id: 'rp1',
            year: '2023',
            emissions: {
              calculatedTotalEmissions: 1000,
            },
            economy: {
              employees: {
                value: 100,
                unit: 'FTE',
              },
            },
          },
        ],
      },
    ];

    const result = addRelatableNumbers(companies);

    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerMillionRevenue).toBeNull();
    expect(result[0].reportingPeriods[0].relatableNumbers.co2PerEmployee).toBeCloseTo(10, 5);
  });
});
