import mappings from '../data/mappings.json'
import example from '../data/example.json'

const prompt = `I have previously sent a text for analysis by GPT-4. The responses I received need to be aggregated and outputted in a strict JSON format.



You are now in the step G of the process which means you should try to summarise the detailed extraction so please keep the most relevant data from the previous steps in mind and make sure to include it in the final output. The output format will be reviewed once more in later steps so you can include comments etc in the JSON.
\`\`\`mermaid
flowchart TB

    A[PDF]
    B{Is in cache?}
    C[Download PDF]
    D[Index Database]
    E[Search Database]
    F[Extract Emissions]
    G[JSON]

    Industry[Extract Industry]
    Goals[Extract Climate Goals]
    Review[Reasonability Assessment]


    DB[OpenSearch/Kibana]

    A --> B --> C --> D --> E ---> F ---> G ---> H
    B --(Cached)--> E

    F --> CompanyName --(.company)--> G
    F --> Industry --(.industry)--> G
    F --> Scope1+2 --(.scope1)--> G
    F --> Scope3 --(.scope3)--> G
    F --> Goals --(.goals)--> G
    F --> Initiatives --(.initiatives)--> G
    F --> Contacts --(.contacts)--> G
    F --> Turnover --(.turnover)--> G
    F --> Factors --(.factors)--> G
    F --> Wikidata --(.wikidata)--> G

    G --> Format --(json)--> H

    H --> Review --> DB
    H --> Review --> DB
\`\`\`

**Market-Based Emissions**
If the data includes market-based emissions,
include them as the emissions for scope 2.

**Biogenic CO2**
If the data includes biogenic CO2, include it in the scope 1 emissions.

**Public Comment**
When seeing the data in whole, also feel free to update the publicComment
accordingly. We are focused on the quality of the reporting, not the company itself or their
emissions but if something is unclear or seems off, please mention it in the publicComment.

**NEVER CALCULATE ANY EMISSIONS**
If you can't find any data or if you are uncertain,
report it as null. If the company has reported individual categories but no totals, never
try to calculate totals; just report it as is.

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

**Example**: The following is an example of the JSON structure you should output. Make sure to include all the properties in the output.
\`\`\`json
${JSON.stringify(example, null, 2)}
\`\`\`

`

export default prompt
