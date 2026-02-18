# Sustainability MCP Server

A Model Context Protocol (MCP) server for processing sustainability reports and extracting ESG (Environmental, Social, and Governance) data from corporate and municipal reports.

## Overview

This MCP server provides AI agents and LLMs with tools to:

- Identify companies on Wikidata
- Parse and index PDF sustainability reports
- Extract emissions data (Scope 1, 2, 3)
- Search and analyze report content
- Validate and publish data to databases

The server is designed as a **library-first architecture** where all business logic lives in pure functions that can be used by both:

- **BullMQ workers** (existing job orchestration system)
- **MCP tools** (new AI agent interface)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Layer                             │
│  (User/LLM interface - simple tools)                        │
│  - identify_company                                          │
│  - search_company_options                                    │
│  - parse_sustainability_report (coming)                      │
│  - extract_emissions_data (coming)                           │
│  - search_report (coming)                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Wrappers (await jobs)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      BullMQ Layer                            │
│  (Job orchestration, retries, concurrency)                 │
│  - Existing workers continue to work                         │
│  - No code duplication                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Workers (business logic)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Common Library                            │
│  (PDF parsing, AI extraction, vector DB, schemas)          │
│  - Pure functions (input → output)                          │
│  - No side effects                                           │
│  - Shared by both BullMQ and MCP                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Pure Functions Without Side Effects

All business logic is implemented as pure functions:

- ✅ Take input as parameters
- ✅ Return output
- ❌ No Discord UI logic
- ❌ No job chaining
- ❌ No database persistence
- ❌ No job.updateData()

**Example:**

```typescript
// Pure function in common library
export async function identifyCompany(
  companyName: string,
): Promise<WikidataResult> {
  const searchResults = await searchCompany({ companyName })
  const entities = await getWikidataEntities(searchResults.map((r) => r.id))
  const wikidata = await selectBestMatch(entities)
  return wikidata
}

// BullMQ worker wrapper
const guessWikidata = new DiscordWorker(
  QUEUE_NAMES.GUESS_WIKIDATA,
  async (job) => {
    const wikidata = await identifyCompany(job.data.companyName)
    // BullMQ-specific logic (Discord UI, job chaining, etc.)
    await job.updateData({ ...job.data, wikidata })
    return wikidata
  },
)

// MCP tool wrapper
export const identifyCompanyTool = {
  name: 'identify_company',
  handler: async (input) => {
    return await identifyCompany(input.companyName)
  },
}
```

### 2. No Code Duplication

The same business logic is used by both BullMQ and MCP. This means:

- Bug fixes apply to both systems
- No maintenance overhead
- Consistent behavior

### 3. Easy Migration to Remote MCP

The MCP layer consists only of thin wrappers. When we're ready to deploy as a remote MCP server:

- Simply move the `mcp/` directory to its own repository
- Publish as an NPM package
- Configure MCP clients to use the remote server

## Available Tools

### `identify_company`

Identifies a company on Wikidata based on the company name. Uses AI to select the best match from search results, prioritizing companies with carbon footprint reporting and Swedish companies.

**Input:**

```json
{
  "companyName": "Telia Company"
}
```

**Output:**

```json
{
  "wikidata": {
    "node": "Q123456",
    "url": "https://www.wikidata.org/wiki/Q123456",
    "logo": "https://commons.wikimedia.org/wiki/File:Telia_logo.svg",
    "label": "Telia Company",
    "description": "Swedish telecommunications company"
  }
}
```

### `search_company_options`

Searches for company options on Wikidata without making a selection. Useful when you want to show multiple potential matches to the user.

**Input:**

```json
{
  "companyName": "Telia"
}
```

**Output:**

```json
{
  "options": [
    {
      "id": "Q123456",
      "label": "Telia Company",
      "description": "Swedish telecommunications company"
    },
    {
      "id": "Q789012",
      "label": "Tiaa",
      "description": "American financial services company"
    }
  ]
}
```

## Planned Tools

- [ ] `parse_sustainability_report` - Parse and index PDF sustainability reports
- [ ] `search_report` - Search for specific topics in a report
- [ ] `extract_emissions_data` - Extract all emissions data (Scope 1, 2, 3)
- [ ] `extract_company_info` - Extract company metadata (industry, goals, initiatives)
- [ ] `compare_reports` - Compare data between two reports
- [ ] `validate_data` - Validate extracted data against the report
- [ ] `publish_to_database` - Publish validated data to the database
- [ ] `get_report_summary` - Get a quick summary of a report
- [ ] `search_companies` - Search for companies in the database

## Usage

### Local MCP Server

Add this to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "sustainability": {
      "command": "node",
      "args": ["--import", "tsx", "/path/to/garbo/mcp/src/index.ts"],
      "env": {
        "OPENAI_API_KEY": "your-api-key",
        "BERGET_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Programmatic Usage

```typescript
import { identifyCompany } from '@garbo/sustainability-mcp/lib'

const wikidata = await identifyCompany('Telia Company')
console.log(wikidata)
// {
//   node: 'Q123456',
//   url: 'https://www.wikidata.org/wiki/Q123456',
//   label: 'Telia Company',
//   description: 'Swedish telecommunications company'
// }
```

### Example Workflow with AI Agent

```
User: "I have a sustainability report for Telia Company. Can you help me extract the emissions data?"

AI Agent:
1. identify_company("Telia Company")
   → Returns Wikidata info for Telia

2. parse_sustainability_report("https://example.com/telia-report.pdf")
   → Returns report ID with indexed content

3. extract_emissions_data(reportId)
   → Returns Scope 1, 2, 3 emissions per year

4. validate_data(emissionsData, reportId)
   → Returns validation results with confidence

5. publish_to_database(validatedData)
   → Publishes to database
```

## Development

### Project Structure

```
mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # MCP tool wrappers
│   │   ├── index.ts
│   │   └── identifyCompany.ts
│   └── lib/                  # Pure business logic
│       └── identifyCompany.ts
├── package.json
├── tsconfig.json
├── README.md
├── ARCHITECTURE.md           # Detailed architecture docs
└── STATUS.md                 # Implementation status
```

### Build

```bash
cd mcp
npm run build
```

### Run Locally

```bash
cd mcp
npm run dev
```

## Migration Plan

### Phase 1: Core Library (Current)

- ✅ Create pure functions for Wikidata identification
- ✅ Create MCP tools as wrappers
- ✅ Test with local MCP server

### Phase 2: PDF Processing

- Extract PDF parsing logic from `doclingParsePDF.ts`
- Create `parsePdf()` pure function
- Create `parse_sustainability_report` MCP tool
- Update BullMQ worker to use pure function

### Phase 3: Emissions Extraction

- Extract scope 1, 2, 3 extraction logic
- Create `extractScope1()`, `extractScope2()`, `extractScope3()` pure functions
- Create `extract_emissions_data` MCP tool
- Update BullMQ workers to use pure functions

### Phase 4: Vector Search

- Extract vector database logic
- Create `searchReport()` pure function
- Create `search_report` MCP tool
- Update BullMQ workers to use pure functions

### Phase 5: Remote MCP

- Move `mcp/` to separate repository
- Publish as NPM package `@garbo/sustainability-mcp`
- Deploy remote MCP server
- Update clients to use remote server

### Phase 6: Cleanup

- Remove job chaining from individual workers
- Create orchestrator for job coordination
- Deprecate old worker patterns

## Benefits

### For Development

- ✅ **No code duplication** - Same logic for BullMQ and MCP
- ✅ **Easier testing** - Pure functions are easy to test
- ✅ **Better separation** - Business logic vs infrastructure
- ✅ **Type safety** - Full TypeScript support

### For Operations

- ✅ **Flexibility** - Use BullMQ with Discord UI OR MCP with AI agents
- ✅ **Scalability** - Easy to migrate to remote MCP
- ✅ **Reliability** - Tested code from existing BullMQ workers
- ✅ **Maintainability** - Single source of truth

### For AI Agents

- ✅ **Simple interface** - High-level tools that "just work"
- ✅ **Consistent behavior** - Same logic as production system
- ✅ **Rich output** - Structured data with Zod schemas
- ✅ **Error handling** - Clear error messages

## Testing with OpenCode

The MCP server is configured in `opencode.json`:

```json
{
  "mcp": {
    "sustainability": {
      "type": "local",
      "command": ["node", "--import", "tsx", "mcp/src/index.ts"],
      "enabled": true,
      "environment": {
        "OPENAI_API_KEY": "{env:OPENAI_API_KEY}",
        "BERGET_API_KEY": "{env:BERGET_API_KEY}"
      },
      "description": "MCP server for processing sustainability reports and extracting ESG data. Tools: identify_company, search_company_options, and more coming soon."
    }
  }
}
```

To test with an AI agent:

1. Ensure environment variables are set
2. Start the MCP server (it will auto-start when needed)
3. Ask the AI to use the tools:
   - "Identify the company Telia Company on Wikidata"
   - "Search for company options for 'Telia'"

## Contributing

This is an active project. When adding new tools:

1. Create pure function in `mcp/src/lib/`
2. Create MCP tool wrapper in `mcp/src/tools/`
3. Update BullMQ worker to use pure function (if applicable)
4. Add tests
5. Update documentation

## License

MIT

## Contact

For questions or feedback, please reach out to the Klimatbyrån team.
