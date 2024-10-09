const prompt = `I have previously sent a text for analysis by GPT-4. The responses I received needs to be verified and corrected according to a schema to be able to save to the db. Below are your instructions.

You are now in the step H of the process that starts with raw extraction and then more detailed extraction so please keep the most relevant data from the previous steps in mind and make sure to include it in the final output in the correct format.
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


    DB[Database]

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

**Data Output Format**:
Present the extracted data in a structured JSON format, including all information you have received from the previous steps. Never include any comments in the JSON output.

**NEVER USE N/A or similar**
If a value is not available, report it as null or remove the field. For scope3 categories, you don't need to include the category if the value is null.

**Fiscal Year**:
If the fiscal year is broken, please use the latest year as key when presenting the data. For example: emissions for 2021/2022 should be presented under the key "2022". Specify the fiscal year in the JSON output.

**Units**:
If conversion is needed when extracting the data, you are only allowed to convert between different scales of the same
unit but never summarize or merge two fields into one or convert between different currencies. For example, if the data is in MSEK, GSEK, MUSD, MEUR etc
you should convert it to base currency (SEK, USD, EUR). If the emissions are in giga tonnes CO2 (or similar), you should
convert it to tCO2e (metric tonnes CO2e).

**Data Schema**:
This is the elastic schema that will be used to index the results. Make sure to follow this precisely, making sure each value is the correct data type.
If the input doesn't match the data type, convert it (from string to number or vice versa) even if it means setting it to null.
If the input doesn't have a value, please make sure to set it to null or an empty string (according to the mappings).
Every property should be present in the output, make especially sure to include all the properties in the emission categories.

*** Avoid formatting errors***
These are some examples that happens when the output is not correctly formatted:

[report.emissions.2022.scope3.categories.16_other] of type [long] in document with id '935401c8-2f8b-4549-a650-4c1565e46080'. Preview of field's value: 'more than 80% of Camurus climate impact is in scope 3'
ResponseError: illegal_argument_exception: [illegal_argument_exception] Reason: mapper [report.factors.value] cannot be changed from type [long] to [float]
ResponseError: mapper_parsing_exception: [mapper_parsing_exception] Reason: failed to parse field [report.emissions.2022.scope3.categories.11_useOfSoldProducts] of type [long] in document with id '254318db-872a-479d-8540-38eb146c7ba0'. Preview of field's value: '{energyInput=374759000, energyLoss=59405000}'


Reply with JSON without any comments, excuses or markdown formatting. Wrap your message with:
\`\`\`json
\`\`\`
`

export default prompt
