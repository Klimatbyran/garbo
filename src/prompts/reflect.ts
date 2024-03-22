const prompt = `
I have previously sent a text for analysis by GPT-4. The answer I got back needs to be verified. Please analyse the text and make sure it's correct according to the extract from the source PDF (provided).

Reasonableness Assessment**: Assess the magnitude of the reported figures. If there appears to be a significant discrepancy or something seems unreasonable (e.g., figures that seem too low or too high compared to the company's size and sector), point this out and suggest a possible explanation or recommendation for further review.

Also convert the JSON to valid json and convert all units to metric ton CO2e. We will take the output from this and add it directly to our database and publich them on the Internet. Please make sure you are correct in all calculations and be clear if you are uncertain in any case. If you are uncertain, please provide a recommendation for further review.

**Data Output Format**: Present the extracted data in a structured JSON format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.  If possible, also include the company's name and organization number in the JSON structure.

**Important** Always generate this exact JSON structure, even if you cannot find the data. Indicate missing data with the error codes below, but make sure that the JSON structure is consistent. For example, if you cannot find the scope 3 categories you must make sure that the categories object is a valid JSON array.

    Example JSON structure:

    {
      "companyName": "Example Company",
      "organizationNumber": "123456789",
      "bransch": "Manufacturing",
      "baseYear": "2019",
      "url": "https://example.com",
      "emissions": [
       {
          "year": "2019",
          "scope1": {
            "emissions": "1234",
            "unit": "Mt CO2e",
            "baseYear": "2019"
          },
          "scope2": {
            "emissions": "1235",
            "unit": "Mt CO2e",
            "mb": "1235",
            "lb": "125",
            "baseYear": "2019"
          },
          "scope3": {
            "emissions": "5322000",
            "unit": "x1000 ton CO2e",
            "baseYear": "2019",
            "categories": {
              "1_purchasedGoods": "100000000",
              "2_capitalGoods": "100000000",
              "3_fuelAndEnergyRelatedActivities": "100000000",
              "4_upstreamTransportationAndDistribution": "100000000",
              "5_wasteGeneratedInOperations": "100000000",
              "6_businessTravel": "100000000",
              "7_employeeCommuting": "100000000",
              "8_upstreamLeasedAssets": "100000000",
              "9_downstreamTransportationAndDistribution": "100000000",
              "10_processingOfSoldProducts": "100000000",
              "11_useOfSoldProducts": "100000000",
              "12_endOfLifeTreatmentOfSoldProducts": "100000000",
              "13_downstreamLeasedAssets": "100000000",
              "14_franchises": "100000000",
              "15_investments": "100000000",
              "16_other": "100000000"
            }
          },
          "totalEmissions": "1553",
          "totalUnit": "Million ton CO2e",
        },
      ],
      "reliability": "High",
      "needsReview": true,
      "reviewComment": "The company has reported emissions in tons instead of metric tons. This is not a common unit and should be converted to metric tons."
      "reviewStatusCode": "412"
    }
**Error Codes**: If you find errors which will not be reflected correctly with a null value, please indicate the error in a way that makes sense with HTTP Status codes.  For example:
    - 'Error 404': Missing data
    - 'Error 409': Data is not reasonable or in conflict with other data
    - 'Error 412': Incomplete or unclear units
    - 'Error 500': General data inconsistency or unavailability
`

export default prompt
