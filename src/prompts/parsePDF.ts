const prompt = `
I have a text extracted from a PDF file containing a company's annual report and need assistance in extracting and analyzing information about their CO2 emissions. Please follow these specific steps:

1. **Reading PDF Files**: Read the text extract above. Look for sections containing data on CO2 emissions, specifically focusing on Scope 1 (direct GHG emissions), Scope 2 (indirect GHG emissions, market based (MB) or locatation based (LB)), and Scope 3 emissions (often marked in other unit x1000), also make sure to mark which GHG-categories that are included in scope 3. Use GHG protocol as a reference for what to look for. If you interpret tables, please know that some of the values might be empty - take extra care to ensure you are not confusing years when parsing the values. Please search specifically for tables featuring continuous annual series, such as data for consecutive years like 2022, 2021, 2020, and 2019, rather than just for separate years like 2022 and 2019.

2. **Handling Units**: Pay close attention to the units and handle them correctly. If emissions are reported in thousands of metric tons (x1,000 ton CO2e), make this clear. Mt CO2e means million ton CO2e. If the figures are on a different scale, such as millions of tons (x1,000,000 ton CO2e), note this but never try to convert units. Also look for any side notes or footnotes that may explain the units. Be very attentive to whether the unit is metric tons (tonnes) or US tons. Always present the data in json even if there are disclaimers in the footnotes.

3. **Data Output Format**: Present the extracted data in a structured JSON format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.

    Example JSON structure:
    {
      "companyName": "Example Company",
      "emissions": [
        {
          "year": "2019",
          "scope1": {
            "emissions": "1234",
            "unit": "Mt CO2e",
            "baseYear": "2019"
          },
          "scope2": {
            "emissions": "123500",
            "unit": "Mt CO2e",
            "mb": "123500",
            "lb": null
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
          "totalUnit": "Million ton CO2e"
        },
        {
          "year": "2020",
          "scope1": {
            "emissions": null
          },
          "scope2": {
            "emissions": null
          }
          "scope3": {
            "emissions": null,
            "categories": {}
          }
        }
      ]
    }

4. **Never calculate total**: Don't forget to include the total CO2 emissions for each year if presented. Never try to calculate any values! For Scope 2 - if both market based (MB) and location based (LB) emissions are presented, include both values and select market based (MB) for the total emissions.

5. **Error Codes**: If not all information is available firstly use null, if there is an error or inconsistency- please use the following error codes to indicate missing data (using HTTP Status codes as inspiration):

    - 'Error 409': Data is not reasonable or in conflict with other data
    - 'Error 412': Incomplete or unclear units
    - 'Error 500': General data inconsistency or unavailability

6. Comma separators. Never use any comma separators or spaces in the numbers.

Then, send the results of your analysis back to me.
`

export default prompt
