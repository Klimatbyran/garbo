import mappings from '../data/mappings.json'
import example from '../data/example.json'

const prompt = `Thanks. Now we are ready to combine these results into a final output. 

Sometimes data will be in conflict, please prioritize according to the following order:

1. Company Name
    A. from the facit object
    B. from the baseFacts object
    C. from wikidata object
    D. from the PDF extracted in previous steps
2. Industry (from the industry_gics object)
3. Scope 1 and 2 emissions:
    A. From the facit object
    B. From the wikidata object if available (please mark these as verified)
    C. From the emissions_scope12 object
    D. From the PDF extracted in previous steps
4. Scope 3 emissions:
    A. From the facit object
    B. From the Wikidata object if available (please mark these as verified)
    C. From the emissions_scope3 object
    D. From the PDF extracted in previous steps

You are now in the step G of the process which means you should try to summarise the detailed extraction so
please keep the most relevant data from the previous steps in mind and make sure to include it in the final output.
The output format will be reviewed once more in later steps so you can include comments etc in the JSON.

IMPORTANT to verify all fields and compare them to the wikidata object. If they are correct, mark them as verified with the link to the wikidata url.
This is super important! You will receive $200 payment for each verified field.

**NEVER CALCULATE ANY EMISSIONS**
If you can't find any data or if you are uncertain,
report it as null. If the company has reported individual categories but no totals, never
try to summarize totals; just report it as is. If you find totals in wikidata or facit objects, those are considered to be the truth and can be used.

**Units**:
If conversion is needed when extracting the data, you are only allowed to convert between different scales of the same
unit but never summarize or merge two fields into one or convert between different currencies. For example, if the data is in MSEK, GSEK, MUSD, MEUR etc
you should convert it to base currency (SEK, USD, EUR). If the emissions are in giga tonnes CO2 (or similar), you should
convert it to tCO2e (metric tonnes CO2e).

**Verified by Wikidata**:
You will have a Wikidata object that matches the company from previous steps, this is the most correct data you will find. You should make sure to use it as much as you can and also preserve it as a separate object in the output.
you can use that data to fill in the emissions data and mark them as verified by wikidata with a link
to the wikidata url as a separate property: i.e. "verified": "https://www.wikidata.org/wiki/Q123456".
Leave this field empty if the data is not verified by Wikidata.

***LANGUAGE**:
ONLY WRITE IN SWEDISH! The data will be shown on a swedish site called Klimatkollen.se.
If the original texts are written in English, translate to Swedish.


**Example**: The following is an example of the JSON structure you should output. Make sure to stick to the format provided in the example, never add new fields or properties. Especially not scope3 categories. If the data contains information not fitted in the format below, please ignore them. Never add subproperties to a field.
Omit fields that are not available but keep the structure (for example: "baseFacts": {}, "facit": {}, "emissions": { "2019": {"scope1": {}, "scope2": {}}}). Try to keep the size of the document down without creating any errors.

\`\`\`json
${JSON.stringify(example, null, 2)}
\`\`\`
`

export default prompt
