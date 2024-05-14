const prompt = `I have previously sent a text for analysis by GPT-4. The responses I received need to be aggregated and outputted in a strict JSON format.

**Data Output Format**: Present the extracted data in a structured JSON format, including the company name, industry, sector, industry group, base year, URL, emissions data, goals, reliability, and review comments as per the specifications.
**Market Based Emissions**: If the data includes market-based emissions, include them as the emissions for scope2.
**Public Comment**: When seeing the data in whole, also feel free to update the publicComment accordingly. We are focused on the quality of the reporting, not the company itself or their emissions but if something is unclear or seems off, please mention it in the publicComment.
**Important** Always generate this exact JSON structure:

\`\`\`json
{
  "companyName": "Example Company",
  "industry": "Manufacturing",
  "sector": "Industrial Goods",
  "industryGroup": "Heavy Industry",
  "baseYear": "2019",
  "url": "https://example.com",
  "emissions": [
    {
      "year": "2019",
      "scope1": {
        "emissions": 1234,
        "unit": "metric ton CO2e"
      },
      "scope2": {
        "emissions": 1235,
        "unit": "metric ton CO2e",
        "mb": null,
        "lb": "125"
      },
      "scope3": {
        "emissions": 5322000,
        "unit": "metric ton CO2e",
        "categories": {
          "1_purchasedGoods": 100000000,
          "2_capitalGoods": 100000000,
          "3_fuelAndEnergyRelatedActivities": 100000000,
          "4_upstreamTransportationAndDistribution": 100000000,
          "5_wasteGeneratedInOperations": 100000000,
          "6_businessTravel": 100000000,
          "7_employeeCommuting": 100000000,
          "8_upstreamLeasedAssets": 100000000,
          "9_downstreamTransportationAndDistribution": 100000000,
          "10_processingOfSoldProducts": 100000000,
          "11_useOfSoldProducts": 100000000,
          "12_endOfLifeTreatmentOfSoldProducts": 100000000,
          "13_downstreamLeasedAssets": 100000000,
          "14_franchises": 100000000,
          "15_investments": 100000000,
          "16_other": 100000000
        }
      },
      "turnover": [
        {
          "year": "2019",
          "value": 123456789,
          "unit": "USD"
        }
      ]
      "totalEmissions": 1553,
      "totalUnit": "metric ton CO2e"
    }
  ],
  "factors": [
    {"product": "car", "description": "CO2e per km", "value": 0.2, "unit": "kgCO2e/km"}
  ],
  "contacts": [
    {"name": "John Doe", "role": "CSR Manager",
    "email": "john@example.com", "phone": "123456789"}
  ],
  "goals": [
    {
      "description": "Net zero before [year].",
      "year": 2038,
      "reductionPercent": 100
      "baseYear": "2019"
    }
  ],

  "initiatives": [
    {
      "description": "We plan to switch to train for all business trips.",
      "year": 2025,
      "reductionPercent": 30,
      "scope": "scope3.6_businessTravel",
      "comment": "We expect this measure to reduce CO2 emissions in scope 3 business travel"
    }
  ],
  "reliability": "High",
  "needsReview": true,
  "reviewComment": "The company has reported conflicting numbers in scope 3 compared to what could be expected and what is concluded in the totals. This needs further review."
}
\`\`\`

**Instructions**:
This is the elastic schema that will be used to index the results. Make sure to follow this precisely, making sure each value is the correct data type.
If the input doesn't match the data type, please make sure to convert it to the correct type even if it means setting it to null.
If the input doesn't have a value, please make sure to set it to null or an empty string.
Every property should be present in the output, make especially sure to include all the properties in the emission categories.

{
  type: 'object',
  properties: {
    companyName: { type: 'keyword' },
    industry: { type: 'keyword' },
    sector: { type: 'keyword' },
    industryGroup: { type: 'keyword' },
    baseYear: { type: 'keyword' },
    url: { type: 'keyword' },

    initiatives: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            description: { type: 'text' },
            year: { type: 'keyword' },
          },
        },
      },
    },

    goals: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            description: { type: 'text' },
            year: { type: 'keyword' },
            target: { type: 'double' },
            baseYear: { type: 'keyword' },
          },
        },
      },
    },
    factors: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            product: { type: 'keyword' },
            description: { type: 'text' },
            value: { type: 'double' },
            unit: { type: 'keyword' },
          },
        },
      },
    },
    turnover: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            year: { type: 'keyword' },
            value: { type: 'double' },
            unit: { type: 'keyword' },
          },
        },
      },
    },
    emissions: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            year: { type: 'keyword' },
            scope1: {
              properties: {
                emissions: { type: 'double' },
                unit: { type: 'keyword' },
              },
            },
            scope2: {
              properties: {
                emissions: { type: 'double' },
                unit: { type: 'keyword' },
                mb: { type: 'double' },
                lb: { type: 'double' },
              },
            },
            scope3: {
              properties: {
                emissions: { type: 'double' },
                unit: { type: 'keyword' },
                baseYear: { type: 'keyword' },
                categories: {
                  properties: {
                    '1_purchasedGoods': { type: 'double' },
                    '2_capitalGoods': { type: 'double' },
                    '3_fuelAndEnergyRelatedActivities': {
                      type: 'double',
                    },
                    '4_upstreamTransportationAndDistribution': {
                      type: 'double',
                    },
                    '5_wasteGeneratedInOperations': {
                      type: 'double',
                    },
                    '6_businessTravel': { type: 'double' },
                    '7_employeeCommuting': { type: 'double' },
                    '8_upstreamLeasedAssets': {
                      type: 'double',
                    },
                    '9_downstreamTransportationAndDistribution':
                      {
                        type: 'double',
                      },
                    '10_processingOfSoldProducts': {
                      type: 'double',
                    },
                    '11_useOfSoldProducts': { type: 'double' },
                    '12_endOfLifeTreatmentOfSoldProducts': {
                      type: 'double',
                    },
                    '13_downstreamLeasedAssets': {
                      type: 'double',
                    },
                    '14_franchises': { type: 'double' },
                    '15_investments': { type: 'double' },
                    '16_other': { type: 'double' },
                  },
                },
              },
            },
            totalEmissions: { type: 'double' },
            totalUnit: { type: 'keyword' },
          },
        },
      },
    },
    contacts: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            name: { type: 'text' },
            role: { type: 'text' },
            email: { type: 'keyword' },
            phone: { type: 'keyword' },
          },
        },
      },
    },
    publicComment: { type: 'text' },
    reliability: { type: 'keyword' },
    needsReview: { type: 'boolean' },
    reviewComment: { type: 'text' },
  },
}
`

export default prompt
