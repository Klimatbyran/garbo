const prompt = `
I have previously sent a text for analysis by GPT-4. The answer I got back needs to be verified. Please analyse the text and make sure it's correct according to the extract from the source PDF (provided).

Also convert the JSON to valid json and convert all units to metric ton CO2e. We will take the output from this and add it directly to our database and publich them on the Internet. Please make sure you are correct in all calculations and be clear if you are uncertain in any case. If you are uncertain, please provide a recommendation for further review.

**Data Output Format**: Present the extracted data in a structured JSON format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.  If possible, also include the company's name and organization number in the JSON structure.

    Example JSON structure:

    {
      "CompanyName": "Example Company",
      "OrganizationNumber": "123456789",
      "URL": "https://example.com",
      "EmissionsData": {
        "2019": {
          "Scope1": "1234000",
          "Scope1Unit": "ton CO2e",
          "Scope2": "1235000",
          "Scope2_MB": "1235000",
          "Scope2_LB": "12500",
          "Scope2Unit": "ton CO2e",
          "Scope3": "532200000",
          "Scope3Unit": "ton CO2e",
          "TotalEmissions": "15530000000",
          "TotalUnit": "ton CO2e"
        }
        // Additional years follow the same structure
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
