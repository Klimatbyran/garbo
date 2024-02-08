const prompt = `
I have previously sent a text for analysis by GPT-4. The answer I got back needs to be verified. Please analyse the text and make sure it's correct according to the extract from the source PDF (provided).

Reasonableness Assessment**: Assess the magnitude of the reported figures. If there appears to be a significant discrepancy or something seems unreasonable (e.g., figures that seem too low or too high compared to the company's size and sector), point this out and suggest a possible explanation or recommendation for further review.

Also convert the JSON to valid json and convert all units to metric ton CO2e. We will take the output from this and add it directly to our database and publich them on the Internet. Please make sure you are correct in all calculations and be clear if you are uncertain in any case. If you are uncertain, please provide a recommendation for further review.

**Data Output Format**: Present the extracted data in a structured JSON format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.  If possible, also include the company's name and organization number in the JSON structure.

    Example JSON structure:

    {
      "CompanyName": "Example Company",
      "Bransch": "Manufacturing",
      "BaseYear": "2019",
      "URL": "https://example.com",
       "2019": {
          "Scope1": {
            "Emissions": "1234",
            "Unit": "Mt CO2e",
            "BaseYear": "2019"
          },
          "Scope2": {
            "Emissions": "1235",
            "Unit": "Mt CO2e",
            "MB": "1235",
            "LB": "125",
            "BaseYear": "2019"
          },
          "Scope3": {
            "Emissions": "5322000",
            "Unit": "x1000 ton CO2e",
            "BaseYear": "2019",
            "Categories": {
              "1_PurchasedGoods": "100000000",
              "2_CapitalGoods": "100000000",
              "3_FuelAndEnergyRelatedActivities": "100000000",
              "4_UpstreamTransportationAndDistribution": "100000000",
              "5_WasteGeneratedInOperations": "100000000",
              "6_BusinessTravel": "100000000",
              "7_EmployeeCommuting": "100000000",
              "8_UpstreamLeasedAssets": "100000000",
              "9_DownstreamTransportationAndDistribution": "100000000",
              "10_ProcessingOfSoldProducts": "100000000",
              "11_UseOfSoldProducts": "100000000",
              "12_EndOfLifeTreatmentOfSoldProducts": "100000000",
              "13_DownstreamLeasedAssets": "100000000",
              "14_Franchises": "100000000",
              "15_Investments": "100000000",
              "16_Other": "100000000"
            }
          },
          "TotalEmissions": "1553",
          "TotalUnit": "Million ton CO2e",
        },
      "Reliability": "High",
      "NeedsReview": true,
      "ReviewComment": "The company has reported emissions in tons instead of metric tons. This is not a common unit and should be converted to metric tons."
      "ReviewStatusCode": "412"
    }
**Error Codes**: If you find errors which will not be reflected correctly with a null value, please indicate the error in a way that makes sense with HTTP Status codes.  For example:
    - 'Error 404': Missing data
    - 'Error 412': Incomplete or unclear units
    - 'Error 409': Data is not reasonable or in conflict with other data
    - 'Error 500': General data inconsistency or unavailability
`

export default prompt
