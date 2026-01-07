# Garbo Pipeline Documentation

This documentation tries to give an easy overview over the order of the pipeline steps, their functionality and structure of input and output. The documentation tries to explain the pipeline jobs in the execution order, parallel jobs will be explained after each other.

## How are Jobs executed?

Pipeline jobs are executed by adding a job directly to the corresponding pipeline or creating a flow. A flow is used if a future job should await multiple previous jobs.

### Adding a Job to a Queue

To queue a job simply call the method `add()` on the `queue` property of the corresponding job class. The method takes a name for the job to be executed, its input data and additional options.

```typescript
pipelineStepX.queue.add(name: string, data: any: opts?: JobsOptions)
```

**Example**:

```typescript
pipelineStepX.queue.add(
  'Dummy Job',
  {
    msg: 'Hello World',
    currentYear: 2025,
  },
  {
    backoff: {
      type: 'fixed',
      delay: 60_000,
    },
    attempts: 10,
  },
)
```

### Creating a Flow

To allow the creation of jobs depending on multiple other jobs, flows can be used. First a new object of class `FlowProducer` has to be created.

```typescript
const flow = new FlowProducer({ connection: redis })
```

In the creation a connection to the redis server is passed.

A flow than can be created by simply calling the method `add()` on the FlowProducer object.

```typescript
flow.add(flow: FlowJob, opts?: FlowOpts);
```

The `FlowJob` object looks like this:

```typescript
name: string
queueName: string,
data: any
chrildren: FlowJob[],
opts: FlowOpts
```

The property `name` specifies the display name of the job to run. `queueName` specifies the job class, `data` specifies the jobs input data, `children` specifies an array of children job on which the partent job depends on. The children jobs are therefore executed first. Last `opts` contains additional options for the job, like the number of attemps.

**Example:**

```typescript
await flow.add({
      name: 'Parent Job #1'
      queueName: 'parentJob',
      data: { },
      children: [
        {
          name: 'Child #1',
          queueName: 'childrenJob1',
          opts: {failParentOnFailure: true},
          data: {user: 'Alice'},
        },
        {
          name: 'Child #2',
          queueName: 'childrenJob2',
          opts: {...baseOpts, failParentOnFailure: true},
          data: {
            ...baseInputData,
            type: JobType.FiscalYear,
          },
        },
      ],
      opts: {...baseOpts},
    })
```

## General Structure of the Pipeline

```mermaid
flowchart TD
    A[parsePdf] -->|not cached| B[doclingParsePDF]
    B --> C[indexMarkdown]
    C --> D[precheck]
    A -- cached? --> D
    D --> F[guessWikidata]
    D --> G[followUp-fiscalYear]
    F --> H[extractEmissions]
    G --> H
    H --> J[followUp-industryGics]
    H --> K[followUp-scope1+2]
    H --> L[followUp-scope3]
    H --> M[followUp-biogenic]
    H --> N[followUp-economy]
    H --> O[followUp-goals]
    H --> P[followUp-initiatives]
    H --> Q[followUp-baseYear]
    J --> R[checkDB]
    K --> R
    L --> R
    M --> R
    N --> R
    O --> R
    P --> R
    Q --> R
    R --> T[diffReportingPeriods]
    R --> U[diffIndustry]
    R --> V[diffGoals]
    R --> W[diffBaseYear]
    R --> X[diffInitiatives]
    T --> Y[saveToAPI]
    U --> Y
    V --> Y
    W --> Y
    X --> Y
    T --> AD[sendCompanyLink]
    U --> AD
    V --> AD
    W --> AD
    X --> AD
```

### parsePdf

**Called By:** `/pdfs` command of the discord bot defined in `src/discord/commands/pdfs.ts`.

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean
}
```

`url` defines the report URL, `threadId` references the Discord thread where the bot will respond, and `autoApprove` controls whether user approvals are required for data updates.

**Functionality:**

- Checks if the report is already indexed in the VectorDB.
- If cached, directly queues `precheck` with:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    cachedMarkdown: string,
}
```

- If not cached, creates a flow:

```mermaid
flowchart LR
    B[doclingParsePDF] --> C[indexMarkdown]
    C --> D[precheck]
```

Return Value: Job id when enqueuing `precheck` from the cache path; otherwise true after starting the flow.

### doclingParsePDF

**Called By:** The flow construction in the job [parsePdf](#parsepdf) defined in `src/workers/parsePdf.ts`.

**Input Data:**

```typescript
{
  url: string
}
```

**Functionality:**

- Submits an async parsing task to Docling to convert the PDF to markdown.
- Supports two backends via configuration:
  - Local docling-serve: POST `/convert/source/async` → returns `task_id`; poll `/status/poll/{task_id}`; GET `/result/{task_id}`.
  - Hosted Berget AI: POST `/ocr` → returns `{ taskId, resultUrl }`; poll `resultUrl` until `content` is ready.
- Applies a 30s timeout to the initial submission using `AbortController`.

**Return Value:**

```typescript
{
  markdown: string
}
```

### indexMarkdown

**Called By:** The flow construction in the job [parsePdf](#parsepdf) defined in `src/workers/parsePdf.ts`.

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean
}
```

The job receives the standard properties and awaits the `markdown` output from its child job [doclingParsePDF](#doclingparsepdf).

**Functionality:**
Indexes the parsed markdown into the VectorDB for downstream retrieval.

**Return Value:** _none_

### precheck

**Called By:** Either by flow construction in the job [parsePdf](#parsepdf) defined in `src/workers/parsePdf.ts` or directly by the job [parsePdf](#parsepdf) when using cached markdown.

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    cachedMarkdown?: string,
    companyName?: string
    type: JobType
}
```

Additionally, to the three standard fields the job gets three more input properties. Depending if the job was directly called by [nlmParsePDF](#nlmparsepdf) the field `cachedMarkdown` contains the cached markdown extraction which could be directly retrived from the VectorDB and passed to the job. The field `companyName` is deprecated and not used anymore, as the job determines the company name itself. The fiele `type` is also not set and only use to define the name of the wikidata schema.

**Functionality:**

The job first extracts the name of the company from the report using AI with the report as a context. It then uses AI to retrive a short company description from the report. After that it creates a flow with the job [extractEmissions](#extractemissions) as a parent job and passing the following data to it:

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    companyName: string,
    description: string
}
```

With the first three properties being the standard ones and `companyName` and `description` containing the previously retriven values. This job gets assigned to child jobs [followUp](#followup) and [guessWikidata](#guesswikidata). Both again get the same input data as the parent job [extractEmissions](#extractemissions), but additionally the job [followUp](#followup) get the additional field `type` set to `JobType.FiscalYear` as an input property.

**Return Value:**

Job id of the created flow

### guessWikidata

**Called By:** Called by the flow construction in the job [precheck](#precheck) defined in `src/workers/precheck.ts`.

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    companyName: string,
    approved: boolean,
    wikidata: Wikidata,
    overrideWikidataId: EntityId
}
```

The job gets the three standard input properties and four additional ones. The field `companyName` contains the name of the company for which the job guesses the wikidata. `Approved` signals if the guessed wikidata has been approved and the job can proceed. `wikidata` contains the guessed wikidata and `overrideWikidataId` contains an entity id manually given by the user which should be used as the wikidata reference for the company to which the report belongs to.

**Functionality:**

The job first searches wikidata for entities by the matching the entity label to the company name. It checks if the found entities already have emission data and puts those on top of the list of found entities. It then queries an AI to find entity that seems to represent the company. The data of this entity is put into the field `wikidata` of the job's data. The hit is then shown to the user for approval and the job delays itself in the meantime. The approval action by the user sets the field `approved` to true. This leads the job in the next execution to return the found wikidata as a stringified json object. Alternatively, the user can give another wikidata entity id which in the next execution is used to retrive the wikidata of this entity and present it to the user for approval.

**Return Value:**

Stringified object containing the field `wikidata` set to the wikidata of the found entity representing the company on wikidata.

### followUp

**Called by:** The flow construction in the job [precheck](#precheck) defined in `src/workers/precheck.ts` or in the flow construction in the job [extractEmissions](#extractemissions) defined in `src/workers/extractEmissions.ts`

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    type: JobType,
}
```

Despite the three standard properties the job expects the input property `type`. The property `type` defines on which type of data to follow up on. It can be one of the following:

```
IndustriyGics, Scope12, Scope3, Biogenic, Economy,
Goals, Initiatives, FiscalYear, CompanyTags, BaseYear
```

**Functionality:**

The job retrives the relevant prompt, schema and query texts for the corresponding type and queries the relevant markdown parts of the report from the VectorDB.
It then sends the retrived prompt to an AI with the relevant markdowns as context and returns the response.

**Return Value:**

String containg the response from the AI.

### extractEmissions

**Called by:** The flow construction in the job [precheck](#precheck) defined in `src/workers/precheck.ts`.

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    companyName: string
}
```

Apart from the three standart input properties, the job additionally gets the property `companyName` containing the name of the company in the report. Also, the job first awaits the return value of it's two children [followUp](#followup) and [guessWikidata](#guesswikidata).

**Functionality:**
After awaiting it's children the job combines the return values of the childeren with its data in a new base object. It then creates a flow with the job [checkDB](#checkdb) as the parent job getting the input data:

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    companyName: string,
    wikidata: Wikidata,
    fiscalYear: {
      startMonth: number,
      endMonth: number
    }
}
```

The first four properties are just the jobs input properties and the last two `wikidata` and `fiscalYear` are filled with the corresponding information returned from the two child jobs.

The job [checkDB](#checkdb) is assigned eight [followUp](#followup) child jobs of the following job types:

```
IndustriyGics, Scope12, Scope3, Biogenic,
Economy, Goals, Initiatives, BaseYear
```

Each child job gets the same input data as the parent job [checkDB](#checkdb).

**Return Value:** _none_

### checkDB

**Called By:** The flow construction in the job [extractEmissions](#extractemissions) defined in `src/workers/extractEmissions.ts`.

**Input Data:**

```typescript
{
    url: string
    threadId: string,
    autoApprove: boolean,
    companyName: string,
    wikidata: Wikidata,
    fiscalYear: {
      startMonth: number,
      endMonth: number
    }
}
```

The input data contains the three standard properties as well as the property `companyName` containg the company name, `wikidata` containing the corresponding wikidata and `fiscalYear` defining the fiscal year of the company. Also, the job awaits the return values of its eight children adding the following properties to the jobs data:

```typescript
{
  scope12, scope3, biogenic, industry, economy, baseYear, goals, initiatives
}
```

The exact type definitions of each property can be found at the end of the document.

**Functionality:**

After awaiting the return values of it's child jobs, the job queries the database to lookup if the company identified by it's wikidata id already exist. If not the job creates a new company with the respective name, wikidata id and description through the API. After that it creates a flow with the job [sendCompanyLink](#sendcompanylink) as a parent which gets the following input data:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
      startMonth: number,
      endMonth: number
    }
}
```

The data object is identical to the job's input data with the addition of the property `existingCompany` containing the queried or newly created company object.

The job is assigned up to five different child jobs depending if certain return values of the previously awaited child jobs are not undefined. If either `scope12`, `scope3`, `biogenic` or `economy` is not undefined, the job [diffReportingPeriods](#diffreportingperiods) is added as a child job. Additionally, to the input data of it's parent job it receives the properties `scope12`, `scope3`, `biogenic` or `economy` of the previously awaited jobs.
If the property `industry` is not undefined the job [diffIndustry](#diffindustry) is added as a child job getting the same property in addition to the input data of it's parent job as input data.
If the property `goals` is not undefined the job [diffGoals](#diffgoals) is added as a child job getting the same property in addition to the input data of it's parent job as input data.
If the property `baseYear` is not undefined the job [diffBaseYear](#diffbaseyear) is added as a child job getting the same property in addition to the input data of it's parent job as input data.
If the property `initiatives` is not undefined the job [diffInitiatives](#diffinitiatives) is added as a child job getting the same property in addition to the input data of it's parent job as input data.

**Return Value:** _none_

### diffReportingPeriods

**Called By:** The flow construction in the job [checkDB](#checkDB) defined in `src/workers/checkDB.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    scope12?,
    scope3?,
    biogenic?,
    economy?,
}
```

The input data is similar to the input data of the calling job [checkDB](#checkDB), with the addition of the optional properties `scope12`, `scope3`, `biogenic` and `economy`. The first three representing the respecitve emission data retrived from the report by the corresponding [followUp](#followup) jobs and the last economy data about the company also retrived from the report using the speciallized [followUp](#followup) job.

**Functionality:**

As the four properties `scope12`, `scope3`, `biogenic` and `economy` are structured as arrays with each entry containing data for a year, the job first identifies all unique years and for each year creates a seperate reporting period, identified by the year and specified by the fiscal year definition of the company. After that it fills the reporting periods with the data in the properties. It then uses a function to compare the retrived reporting period data with possibly existing data about the same reporting period in the API. If differences are found, these are represented in a diff and a approval flag is set if these diffs include the overwriting of exisiting data to make sure that that does not happen unintentionally. If the diff is not empty meaning that there are changes that could be pushed to the API the job queues a [saveToAPI](#savetoapi) job with the follwing input data:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    body,
    diff,
    requiresApproval,
    apiSubEndpoint: 'reporting-periods'
}
```

Except for the properties identical to the job's input properties the properties `body`, `diff`, `requiresapproval` and `apiSubEndpoint` are added and the properties `scope12`, `scope3`, `biogenic` and `economy` are removed. The property `body` contains the updated reporting periods and metadata for the possible data update. `diff` contains information about the differences between the new and existing data. `requiresApproval` indicates if the update does require the approval of the user, and the property `apiSubEndpoint` specifies the corresponding for API endpoint for the update in this case `reporting-periods`.

**Return Value:**

```typescript
{
  body, diff, requiresApproval
}
```

The job returns the three properties `body`, `diff` and `requiresapproval`. The property `body` contains the updated reporting periods and metadata for the possible data update. `diff` contains information about the differences between the new and existing data and `requiresApproval` indicates if the update does require the approval of the user.

### diffIndustry

**Called By:** The flow construction in the job [checkDB](#checkDB) defined in `src/workers/checkDB.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    industry?
}
```

The input data is similar to the input data of the calling job [checkDB](#checkDB), with the addition of the optional property `industry`. The property contains industry information about the company retrived from the report using the corresponding [followUp](#followup) job.

**Functionality:**

The job uses a method to compare the received industry data with possibly already existing industry data about the company in the API. The comparision returns a diff describing the possible difference between the new data and the data in the API and a flag `requiresApproval` representing if an update of the data requires the users approval to avoid unintentional overwrites. If there is a difference between the two data sets, the job enqueues a [saveToAPI](#savetoapi) job with the following data:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    body,
    diff,
    requiresApproval,
    apiSubEndpoint: 'reporting-periods'
}
```

Except for the properties identical to the job's input properties the properties `body`, `diff`, `requiresapproval` and `apiSubEndpoint` are added and the property `industry` is removed. The property `body` contains the updated industry data and metadata for the possible data update. `diff` contains information about the differences between the new and existing data. `requiresApproval` indicates if the update does require the approval of the user, and the property `apiSubEndpoint` specifies the corresponding for API endpoint for the update in this case `industry`.

**Return Value:**

```typescript
{
  body, diff, requiresApproval
}
```

The job returns the three properties `body`, `diff` and `requiresapproval`. The property `body` contains the updated industry and metadata for the possible data update. `diff` contains information about the differences between the new and existing data and `requiresApproval` indicates if the update does require the approval of the user.

### diffGoals

**Called By:** The flow construction in the job [checkDB](#checkDB) defined in `src/workers/checkDB.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    goals: {
      description: string,
      year?: string,
      target?: number,
      baseYear?: string,
    }
}
```

The input data is similar to the input data of the calling job [checkDB](#checkDB), with the addition of the optional property `goals`. The property contains carbon emission goals information about the company retrived from the report using the corresponding [followUp](#followup) job.

**Functionality:**

The job uses a method to compare the received goals data with possibly already existing goals data about the company in the API. The comparision returns a diff describing the possible difference between the new data and the data in the API and a flag `requiresApproval` representing if an update of the data requires the users approval to avoid unintentional overwrites. If there is a difference between the two data sets, the job enqueues a [saveToAPI](#savetoapi) job with the following data:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    body,
    diff,
    requiresApproval,
    apiSubEndpoint: 'goals'
}
```

Except for the properties identical to the job's input properties the properties `body`, `diff`, `requiresapproval` and `apiSubEndpoint` are added and the property `goals` is removed. The property `body` contains the updated goals data and metadata for the possible data update. `diff` contains information about the differences between the new and existing data. `requiresApproval` indicates if the update does require the approval of the user, and the property `apiSubEndpoint` specifies the corresponding for API endpoint for the update in this case `goals`.

**Return Value:**

```typescript
{
  body, diff, requiresApproval
}
```

The job returns the three properties `body`, `diff` and `requiresapproval`. The property `body` contains the updated goals and metadata for the possible data update. `diff` contains information about the differences between the new and existing data and `requiresApproval` indicates if the update does require the approval of the user.

### diffBaseYear

**Called By:** The flow construction in the job [checkDB](#checkDB) defined in `src/workers/checkDB.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    baseYear?: number
}
```

The input data is similar to the input data of the calling job [checkDB](#checkDB), with the addition of the optional property `baseYear`. The property contains base year information about the company retrived from the report using the corresponding [followUp](#followup) job.

**Functionality:**

The job uses a method to compare the received base year data with possibly already existing base year data about the company in the API. The comparision returns a diff describing the possible difference between the new data and the data in the API and a flag `requiresApproval` representing if an update of the data requires the users approval to avoid unintentional overwrites. If there is a difference between the two data sets, the job enqueues a [saveToAPI](#savetoapi) job with the following data:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    body,
    diff,
    requiresApproval,
    apiSubEndpoint: 'base-year'
}
```

Except for the properties identical to the job's input properties the properties `body`, `diff`, `requiresapproval` and `apiSubEndpoint` are added and the property `baseYear` is removed. The property `body` contains the updated base year data and metadata for the possible data update. `diff` contains information about the differences between the new and existing data. `requiresApproval` indicates if the update does require the approval of the user, and the property `apiSubEndpoint` specifies the corresponding for API endpoint for the update in this case `base-year`.

**Return Value:**

```typescript
{
  body, diff, requiresApproval
}
```

The job returns the three properties `body`, `diff` and `requiresapproval`. The property `body` contains the updated base year and metadata for the possible data update. `diff` contains information about the differences between the new and existing data and `requiresApproval` indicates if the update does require the approval of the user.

### diffInitatives

**Called By:** The flow construction in the job [checkDB](#checkDB) defined in `src/workers/checkDB.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    initiatives: {
      title: string,
      description?: string,
      year?: string,
      scope?: string,
    }
}
```

The input data is similar to the input data of the calling job [checkDB](#checkDB), with the addition of the optional property `initatives`. The property contains information about initatives reducing the company's carbon footpring retrived from the report using the corresponding [followUp](#followup) job.

**Functionality:**

The job uses a method to compare the received initatives data with possibly already existing initatives data about the company in the API. The comparision returns a diff describing the possible difference between the new data and the data in the API and a flag `requiresApproval` representing if an update of the data requires the users approval to avoid unintentional overwrites. If there is a difference between the two data sets, the job enqueues a [saveToAPI](#savetoapi) job with the following data:

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    body,
    diff,
    requiresApproval,
    apiSubEndpoint: 'initatives'
}
```

Except for the properties identical to the job's input properties the properties `body`, `diff`, `requiresapproval` and `apiSubEndpoint` are added and the property `initatives` is removed. The property `body` contains the updated initatives data and metadata for the possible data update. `diff` contains information about the differences between the new and existing data. `requiresApproval` indicates if the update does require the approval of the user, and the property `apiSubEndpoint` specifies the corresponding for API endpoint for the update in this case `initatives`.

**Return Value:**

```typescript
{
  body, diff, requiresApproval
}
```

The job returns the three properties `body`, `diff` and `requiresapproval`. The property `body` contains the updated initatives and metadata for the possible data update. `diff` contains information about the differences between the new and existing data and `requiresApproval` indicates if the update does require the approval of the user.

### saveToAPI

**Called By:** On of the jobs [diffReportingPeriods](#diffreportingperiods), [diffIndustry](#diffindustry), [diffGoals](#diffgoals), [diffBaseYear](#diffbaseyear) and [diffInitiatives](#diffinitatives) in their corresponding files `src/workers/diff<type>.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata,
    fiscalYear: {
        startMonth: number,
        endMonth: number
    },
    approved?: boolean,
    requiresApproval: boolean,
    diff: string,
    body: any,
    apiSubEndpoint: string
}
```

Apart from the first seven properties which are identical to the previous jobs, the properties `approved`, `requiresApproval`, `diff`, `body` and `apiSubEndpoint` are passed as input to the job. `approved` indicated if the intended save to the API is already approved by a user and `requiresApproval` indicates if this approval is required at all. The propery `diff` contains a description of the changes to be applied to the API. `body` contains the data that could be pushed to the API to update the exisisting data and `apiSubEndpoint` indicated the API endpoint to which the update should be pushed.

**Functionality:**

If the API update is approved or the approval is not required the job sanatizes the body containg the updated data and updates the API through a request to the corresponding endpoint with the updated data in the request body. If an approval is required and not yet given the job asks the user for approval and delays itself.

**Return Value:** _None_

### sendCompanyLink

**Called By:** The flow construction in the job [checkDB](#checkDB) defined in `src/workers/checkDB.ts`.

**Input Data:**

```typescript
{
    url: string,
    threadId: string,
    autoApprove: boolean,
    companyName: string
    existingCompany: Company,
    wikidata: Wikidata
}
```

The input data is the same to the input data of the calling job.

**Functionality:**

The job checks if the companies url by querying the API with the wikidata id and name of the company. It then checks if the passed company object is not undefined and sends a link to the user referencing the frontend path to lookup the company and it's data.

**Return Value:**

```typescript
{
  url: string
}
```

The job returns the url to the company page.

## Docling configuration

Docling settings are managed via `src/config/docling.ts`.

Due to current validation, the following environment variables must be present in both local and hosted modes:

```bash
DOCLING_USE_LOCAL=true|false
DOCLING_URL=<base URL including /v1>
BERGET_AI_TOKEN=<token>
```

- Local docling-serve:
  - Set `DOCLING_USE_LOCAL=true`
  - Set `DOCLING_URL=http://localhost:5001/v1` (include the `/v1` suffix)
  - `BERGET_AI_TOKEN` must be a non-empty value due to validation (not used by local backend)
- Hosted Berget AI:
  - Set `DOCLING_USE_LOCAL=false`
  - Provide a valid `DOCLING_URL` and `BERGET_AI_TOKEN`

Endpoints used by `doclingParsePDF`:

- Local: `/convert/source/async`, `/status/poll/{task_id}`, `/result/{task_id}`
- Hosted: `/ocr` (returns `{ taskId, resultUrl }` to poll). Note: `resultUrl` may be relative; the worker will prefix it using the configured base URL.

A 30s timeout is applied to the initial submission request via `AbortController`.

## Appendix

### Datatype Definitions

**Base Year:**

```typescript
baseYear: number
```

**Biogenic:**

```typescript
biogenic: {
    year: number,
    biogenic: {
        total: number,
        unit: 'tCO2e' | 'tCO2',
    }
}
```

**Company Tags:**

```typescript
tags: [
  'public' |
    'large-cap' |
    'mid-cap' |
    'state-owned' |
    'municipality-owned' |
    'private',
]
```

**Economy:**

```typescript
economy: [
    {
        year: number,
        economy?: {
            turnover?: {
                value?: number,
                currency?: string,
            },
            employees?: {
                value?: number,
                unit?: 'FTE' | 'EOY' | 'AVG',
            }
        }
    }
]
```

**Fiscal Year:**

```typescript
fiscalYear: {
    startMonth: number,
    endMonth: number
}
```

**Goals:**

```typescript
goals: [
    {
        description: string,
        year?: string,
        target?: number,
        baseYear?: string
    }
]
```

**IndustyGics:**

```typescript
industry: {
  subIndustryCode: string
}
```

**Initiatives:**

```typescript
initiatives: [
    {
        title: string,
        description?: string,
        year?: string,
        scope?: string
    }
]
```

**Scope 1+2:**

```typescript
scope12: [
    {
        year: numberm
        scope1?: {
            total: number,
            unit: 'tCO2e' | 'tCO2',
        },
        scope2?: {
            mb?: number,
            lb?: number,
            unknown?: number,
            unit: 'tCO2e' | 'tCO2',
        }
    }
]
```

**Scope 3:**

```typescript
scope3: [
    {
        year: number,
        scope3?: {
            categories?: [
                {
                    category: number,
                    total: number,
                    unit: 'tCO2e' | 'tCO2',
                }
            ],
            statedTotalEmissions: {
                total: number,
                unit: 'tCO2e' | 'tCO2',
            }
        }
    }
]
```
