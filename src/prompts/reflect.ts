const prompt = `
I have previously sent a text for analysis by GPT-4. The answer I got back needs to be verified. Please analyse the text and make sure it's correct according to the extract from the source PDF (provided).

Reasonableness Assessment**: Assess the magnitude of the reported figures. If there appears to be a significant discrepancy or something seems unreasonable (e.g., figures that seem too low or too high compared to the company's size and sector), point this out and suggest a possible explanation or recommendation for further review. If the data seems reasonable, please state that as well and provide a brief explanation of why you think so. Set the "needsReview" field to true ONLY if you think the data needs further review.

Also convert the JSON to valid json and convert all units to metric ton CO2e. We will take the output from this and add it directly to our database and publish them on the Internet. Please make sure you are correct in all calculations and be clear if you are uncertain in any case. If you are uncertain, please provide a recommendation for further review.

Industry: Guess the correct industry for this company according to the Global Industry Classification Standard (GICS). Example: "Manufacturing", "Finance", "Healthcare", etc.

**Data Output Format**: Present the extracted data in a structured JSON format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.

**Important** Always generate this exact JSON structure, even if you cannot find the data. Indicate missing data with the error codes below, but make sure that the JSON structure is consistent. For example, if you cannot find the scope 3 categories you must make sure that the categories object is a valid JSON array.

    Example JSON structure:

    {
      "companyName": "Example Company",
      "industry": "Manufacturing",
      "baseYear": "2019",
      "url": "https://example.com",
      "emissions": [
       {
          "year": "2019",
          "scope1": {
            "emissions": 1234,
            "unit": "metric ton CO2e",
            "baseYear": "2019"
          },
          "scope2": {
            "emissions": 1235,
            "unit": "metric ton CO2e",
            "mb": null,
            "lb": "125",
            "baseYear": "2019"
          },
          "scope3": {
            "emissions": 5322000,
            "unit": "metric ton CO2e",
            "baseYear": "2019",
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
          "totalEmissions": 1553,
          "totalUnit": "metric ton CO2e",
        },
      ],
      "reliability": "High",
      "needsReview": true,
      "reviewComment": "The company has reported conflicting numbers in scope 3 compared to what could be expected and what is concluded in the totals. This needs further review."
      "reviewStatusCode": "412"
    }
**Error Codes**: If you find errors which will not be reflected correctly, please indicate the error in a separate field called "status" in way that makes sense with HTTP Status codes.  For example:
    - status: 'OK 200': Looks good
    - status: 'Error 409': Data is not reasonable or in conflict with other data
    - status: 'Error 412': Incomplete or unclear units
    - status: 'Error 500': General data inconsistency or unavailability


This is the elastic schema that will be used to index the results. Make sure to follow this precisely, making sure each value is the correct data type.
If the input doesn't match the data type, please make sure to convert it to the correct type even if it means setting it to null.
If the input doesn't have a value, please make sure to set it to null or an empty string.
Every property should be present in the output, make especially sure to include all the properties in the emission categories.

{
  type: 'object',
  properties: {
    companyName: { type: 'keyword' },
    industry: { type: 'keyword' },
    baseYear: { type: 'keyword' },
    url: { type: 'keyword' },
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
    reliability: { type: 'keyword' },
    needsReview: { type: 'boolean' },
    reviewComment: { type: 'text' },
    reviewStatusCode: { type: 'keyword' },
  },
}
`

export default prompt
