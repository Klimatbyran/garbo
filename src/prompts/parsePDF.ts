const prompt = `
I have a text extracted from a PDF file containing a company's annual report and need assistance in extracting and analyzing information about their CO2 emissions. Please follow these specific steps:

1. **Reading PDF Files**: Read the text extract above. Look for sections containing data on CO2 emissions, specifically focusing on Scope 1 (direct GHG emissions), Scope 2 (indirect GHG emissions, market based (MB) or locatation based (LB)), and Scope 3 emissions (often marked in other unit x1000), also make sure to mark which GHG-categories that are included in scope 3. Use GHG protocol as a reference for what to look for. If you interpret tables, please know that some of the values might be empty - take extra care to ensure you are not confusing years when parsing the values. Please search specifically for tables featuring continuous annual series, such as data for consecutive years like 2022, 2021, 2020, and 2019, rather than just for separate years like 2022 and 2019.

2. **Handling Units**: Pay close attention to the units and handle them correctly. If emissions are reported in thousands of metric tons (x1,000 ton CO2e), make this clear. Mt CO2e means million ton CO2e. If the figures are on a different scale, such as millions of tons (x1,000,000 ton CO2e), note this but never try to convert units. Also look for any side notes or footnotes that may explain the units. Be very attentive to whether the unit is metric tons (tonnes) or US tons. Always present the data in json even if there are disclaimers in the footnotes.

3. **Biogenic Emissions**: Be very mindful of whether biogenic emissions (biogena utsläpp) are included in scope 1, scope 2, or scope 3 emissions. According to the GHG protocol, biogenic emissions must be excluded from scope 1, scope 2, and scope 3. Only include CO2e emissions.

4. **Negative emissions or Offsets**: Do not include negative emissions, nor in terms of negative values or carbon storage. Do not include emission reductions from carbon offsets.

5. **Other emissions**: After identifying Greenhouse Gas emissions that are grouped into Scope 1, 2, 3 and/or the Scope 3 categories provided by the GHG protocol, go on to identify and present other GHG emissions which are not accounted for in these scopes or categories. Indicate the amount in the same format as all other emissions, and display the stated source of emissions.
    For example, if a company states that emissions from “Packaging” amount to 100 ton CO2e, display this as a separate emission source.
    If the report merges categories from the GHG protocol, such as reporting emissions from categories 4 and 9 together, this should be displayed as another emission source. 
    If the report lists emissions from multiple sub-categories to any GHG protocol scope or category, this should be displayed as other emission sources. For example, emissions from flights and hotels could be disclosed separately in the report instead of as business travel.
    The goal is that all emissions presented in the report are identified and displayed.

6. **Data Output Format**: Present the extracted data in a markdown format. Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year. Include other identified emission sources by adding more numbered categories (16, 17 etc) clearly naming them in the same way as they are presented in the report.

Example:
## CompanyName
CO2          2023         2022         2021
---      
Scope 1      19500        33200        36200      
Scope 2      27600        27600        30100      
Scope 3      383000       391600       367500
 
Scope 3:
3_fuelAndEne 134000       128000       113000     
4_upstreamTr 4900         4800         4500       
6_businessTr 245000       255000       250000

7. **Never calculate total**: Don't forget to include the total CO2 emissions for each year if presented. Never try to calculate any values! For Scope 2 - if both market based (MB) and location based (LB) emissions are presented, include both values and select market based (MB) for the total emissions.

8. **Error Codes**: If not all information is available firstly use null, if there is an error or inconsistency- please use the following error codes to indicate missing data (using HTTP Status codes as inspiration):

    - 'Error 409': Data is not reasonable or in conflict with other data
    - 'Error 412': Incomplete or unclear units
    - 'Error 500': General data inconsistency or unavailability

9. Comma separators. Never use any comma separators or spaces in the numbers.

Then, send the results of your analysis back to me.
`

export default prompt
