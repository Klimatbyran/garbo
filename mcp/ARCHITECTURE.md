# Ren Workers Arkitektur

Dokumentation för hur BullMQ-workers ska göras "rena" utan sidoeffekter för att kunna användas av både BullMQ och MCP.

## Problem med nuvarande workers

Nuvarande workers har sidoeffekter:

- De startar automatiskt nästa jobb i en kedja
- De uppdaterar Discord-meddelanden
- De sparar data till databasen
- De skapar nya BullMQ-jobs

## Lösning: Rena Workers

En "ren" worker ska:

1. Ta emot input
2. Utföra sin logik
3. Returnera output
4. **INTE** starta andra jobs
5. **INTE** spara data
6. **INTE** uppdatera Discord

## Exempel: Innan och Efter

### ❌ Innan (Med sidoeffekter)

```typescript
// src/workers/guessWikidata.ts (nuvarande)
const guessWikidata = new DiscordWorker(
  QUEUE_NAMES.GUESS_WIKIDATA,
  async (job) => {
    const wikidata = await identifyCompany(job.data.companyName)

    // SIDOEFFEKT: Sparar till job data
    await job.updateData({ ...job.data, wikidata })

    // SIDOEFFEKT: Skapar Discord-knappar
    const buttonRow = discord.createEditWikidataButtonRow(job)
    await job.sendMessage({
      content: `Is this the correct company?`,
      components: [buttonRow],
    })

    // SIDOEFFEKT: Flyttar jobbet till delayed
    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)

    return wikidata
  },
)
```

### ✅ Efter (Ren)

```typescript
// mcp/lib/identifyCompany.ts (ren funktion)
export async function identifyCompany(
  companyName: string,
): Promise<WikidataResult> {
  // Ren funktion - bara input och output
  const searchResults = await searchCompany({ companyName })
  const entities = await getWikidataEntities(searchResults.map((r) => r.id))
  const wikidata = await selectBestMatch(entities)
  return wikidata
}

// src/workers/guessWikidata.ts (wrapper för BullMQ)
const guessWikidata = new DiscordWorker(
  QUEUE_NAMES.GUESS_WIKIDATA,
  async (job) => {
    // Anropa ren funktion
    const wikidata = await identifyCompany(job.data.companyName)

    // BullMQ-specifik logik (wrapper)
    await job.updateData({ ...job.data, wikidata })
    const buttonRow = discord.createEditWikidataButtonRow(job)
    await job.sendMessage({
      content: `Is this the correct company?`,
      components: [buttonRow],
    })
    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)

    return wikidata
  },
)
```

## Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Layer                                 │
│  identify_company(companyName) → WikidataResult             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Anropar ren funktion
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Common Library                              │
│  identifyCompany(companyName) → WikidataResult              │
│  (Ren funktion - ingen sidoeffekt)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Används av
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼─────────┐
│  BullMQ Worker │          │   MCP Tool       │
│  (Wrapper)     │          │  (Wrapper)       │
│                │          │                  │
│ - Discord UI   │          │ - JSON output    │
│ - Job chaining │          │ - Error handling │
│ - Persistence  │          │                  │
└────────────────┘          └──────────────────┘
```

## Migreringsplan

### Steg 1: Skapa rena funktioner i Common Library

För varje worker, skapa en ren funktion i `mcp/lib/`:

```typescript
// mcp/lib/identifyCompany.ts
export async function identifyCompany(
  companyName: string,
): Promise<WikidataResult>

// mcp/lib/parsePdf.ts
export async function parsePdf(url: string): Promise<{ markdown: string }>

// mcp/lib/extractScope1.ts
export async function extractScope1(url: string): Promise<Scope1Result>

// mcp/lib/extractScope2.ts
export async function extractScope2(url: string): Promise<Scope2Result>

// mcp/lib/extractScope3.ts
export async function extractScope3(url: string): Promise<Scope3Result>
```

### Steg 2: Uppdatera BullMQ Workers

Gör om workers till wrappers som anropar de rena funktionerna:

```typescript
// src/workers/guessWikidata.ts
import { identifyCompany } from '../../mcp/lib/identifyCompany'

const guessWikidata = new DiscordWorker(
  QUEUE_NAMES.GUESS_WIKIDATA,
  async (job) => {
    const wikidata = await identifyCompany(job.data.companyName)
    // BullMQ-specifik logik...
    return wikidata
  },
)
```

### Steg 3: Skapa MCP Tools

Skapa MCP-verktyg som anropar samma rena funktioner:

```typescript
// mcp/tools/identifyCompany.ts
import { identifyCompany } from '../lib/identifyCompany'

export const identifyCompanyTool = {
  name: 'identify_company',
  handler: async (input) => {
    return await identifyCompany(input.companyName)
  },
}
```

### Steg 4: Ta bort job chaining från workers

Istället för att workers startar nästa jobb, låt en orchestrator hantera kedjan:

```typescript
// src/workers/orchestrator.ts
const orchestrator = new DiscordWorker(
  QUEUE_NAMES.ORCHESTRATOR,
  async (job) => {
    // Steg 1: Identifiera företag
    const wikidata = await identifyCompany(job.data.companyName)

    // Steg 2: Extrahera emissions
    const emissions = await extractEmissions(job.data.url)

    // Steg 3: Spara till databas
    await saveToDatabase({ wikidata, emissions })
  },
)
```

## Fördelar

✅ **Ingen kod duplicering** - Samma logik används av både BullMQ och MCP
✅ **Enklare testning** - Rena funktioner är lätta att testa
✅ **Bättre separation of concerns** - Affärslogik vs. infrastruktur
✅ **Enklare att migrera till remote MCP** - Tunna wrappers
✅ **Flexibilitet** - Kan fortfarande använda BullMQ med Discord UI

## Exempel på rena funktioner

### PDF Parsing

```typescript
// mcp/lib/parsePdf.ts
export async function parsePdf(url: string): Promise<{ markdown: string }> {
  const requestPayload = createRequestPayload(url)
  const response = await fetch(doclingApiUrl, {
    method: 'POST',
    body: JSON.stringify(requestPayload),
  })
  const result = await pollForResult(response.taskId)
  return { markdown: result.markdown }
}
```

### Scope 1 Extraktion

```typescript
// mcp/lib/extractScope1.ts
export async function extractScope1(url: string): Promise<Scope1Result> {
  const markdown = await vectorDB.getRelevantMarkdown(url, scope1QueryTexts)
  const result = await askStreamWithContext(
    markdown,
    scope1Prompt,
    scope1Schema,
  )
  return scope1Schema.parse(JSON.parse(result))
}
```

### Vektordatabas-sökning

```typescript
// mcp/lib/searchReport.ts
export async function searchReport(
  url: string,
  query: string,
): Promise<string> {
  const markdown = await vectorDB.getRelevantMarkdown(url, [query])
  return markdown
}
```

## Checklist för att göra en worker ren

- [ ] Funktionen tar bara input som parametrar
- [ ] Funktionen returnerar bara output
- [ ] Ingen Discord UI-logik i funktionen
- [ ] Ingen BullMQ job chaining i funktionen
- [ ] Ingen databas-sparing i funktionen
- [ ] Ingen job.updateData() i funktionen
- [ ] Enhetstester kan verifiera input → output
