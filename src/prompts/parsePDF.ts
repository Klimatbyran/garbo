const prompt = `
I have a text extracted from a PDF file containing a company's annual report and need assistance in extracting and analyzing information about their CO2 emissions. Please follow these specific steps:

1. **Reading PDF Files**: Read the text extract above. Look for sections containing data on CO2 emissions, specifically focusing on Scope 1 (direct GHG emissions), Scope 2 (indirect GHG emissions, market based (MB) or locatation based (LB)), and Scope 3 emissions (often marked in other unit x1000), also make sure to mark which GHG-categories that are included in scope 3. Use GHG protocol as a reference for what to look for. If you interpret tables, please know that some of the values might be empty - take extra care to ensure you are not confusing years when parsing the values. Please search specifically for tables featuring continuous annual series, such as data for consecutive years like 2022, 2021, 2020, and 2019, rather than just for separate years like 2022 and 2019.

2. **Handling Units**: Pay close attention to the units and handle them correctly. If emissions are reported in thousands of metric tons (x1,000 ton CO2e), make this clear. Mt CO2e means million ton CO2e. If the figures are on a different scale, such as millions of tons (x1,000,000 ton CO2e), note this but never try to convert units. Also look for any side notes or footnotes that may explain the units. Be very attentive to whether the unit is metric tons (tonnes) or US tons. Always present the data in json even if there are disclaimers in the footnotes.

3. **Data Output Format**: Present the extracted data in a structured JSON format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.  If possible, also include the company's name and organization number in the JSON structure.

    Example JSON structure:
    {
      "CompanyName": "Example Company",
      "OrganizationNumber": "123456789",
      "EmissionsData": {
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
            },
          },
          "TotalEmissions": "1553",
          "TotalUnit": "Million ton CO2e"
        }
        // Additional years follow the same structure
      }
    }

4. **Include Total**: Don't forget to include the total CO2 emissions for each year if presented. Never try to calculate any values! For Scope 2 - if both market based (MB) and location based (LB) emissions are presented, include both values and select the most relevant one for the total emissions.

5. **Error Codes**: If not all information is available, use the following error codes to indicate missing data (using HTTP Status codes as inspiration):

    - 'Error 404': Missing Scope 1 data
    - 'Error 405': Missing Scope 2 data
    - 'Error 406': Missing Scope 3 data
    - 'Error 412': Incomplete or unclear units
    - 'Error 500': General data inconsistency or unavailability

Then, send the results of your analysis back to me.
`

export default prompt
