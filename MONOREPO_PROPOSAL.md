# Garbo Monorepo Refactoring Proposal

## Overview

This document proposes refactoring the Garbo codebase into a monorepo structure using pnpm workspaces. The goal is to separate concerns, improve code reusability, and enable the MCP server to share business logic with the existing BullMQ workers without code duplication.

## Proposed Structure

```
garbo/
├── packages/
│   ├── schemas/          # Shared Zod schemas
│   │   └── src/
│   │       ├── common.ts
│   │       ├── request.ts
│   │       ├── response.ts
│   │       └── index.ts
│   │
│   ├── shared/           # Shared utilities and configs
│   │   └── src/
│   │       ├── lib/      # Utilities (openai, vectordb, wikidata, etc.)
│   │       ├── config/   # Configuration files
│   │       ├── prompts/  # AI prompts
│   │       └── index.ts
│   │
│   ├── jobs/             # Pure job definitions (no side effects)
│   │   └── src/
│   │       ├── scope1/   # Scope 1 extraction
│   │       ├── scope2/   # Scope 2 extraction
│   │       ├── scope3/   # Scope 3 extraction
│   │       ├── scope12/  # Combined scope 1+2 extraction
│   │       ├── emissions/# Emissions assessment
│   │       └── index.ts
│   │
│   ├── workers/          # BullMQ workers (wrappers around jobs)
│   │   └── src/
│   │       ├── parsePdf.ts
│   │       ├── guessWikidata.ts
│   │       ├── extractEmissions.ts
│   │       └── ... (all existing workers)
│   │
│   ├── api/              # Fastify API + Database
│   │   └── src/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── plugins/
│   │       └── index.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── mcp/              # MCP Server
│       └── src/
│           ├── tools/    # MCP tool wrappers
│           ├── lib/      # Pure functions (shared with workers)
│           └── index.ts
│
├── pnpm-workspace.yaml   # Workspace configuration
├── package.json          # Root package.json
└── tsconfig.json         # Root TypeScript config
```

## Package Dependencies

```
@garbo/schemas
  ↓ (no dependencies)

@garbo/shared
  ↓ depends on
@garbo/schemas

@garbo/jobs
  ↓ depends on
@garbo/schemas
@garbo/shared

@garbo/workers
  ↓ depends on
@garbo/schemas
@garbo/shared
@garbo/jobs

@garbo/api
  ↓ depends on
@garbo/schemas
@garbo/shared
@garbo/jobs

@garbo/mcp
  ↓ depends on
@garbo/schemas
@garbo/shared
@garbo/jobs
```

## Key Principles

### 1. Pure Functions in `@garbo/jobs`

All job definitions in `@garbo/jobs` are pure functions:

- ✅ Take input as parameters
- ✅ Return output
- ❌ No Discord UI logic
- ❌ No job chaining
- ❌ No database persistence
- ❌ No BullMQ-specific code

**Example:**

```typescript
// packages/jobs/src/scope1/extractScope1.ts
export async function extractScope1(
  url: string,
  markdown: string,
): Promise<Scope1Result> {
  const response = await askStreamWithContext(
    markdown,
    scope1Prompt,
    scope1Schema,
    'scope1',
  )
  return scope1Schema.parse(JSON.parse(response))
}
```

### 2. Wrappers in `@garbo/workers`

BullMQ workers are thin wrappers that call pure functions from `@garbo/jobs`:

```typescript
// packages/workers/src/followUp/scope1.ts
import { extractScope1 } from '@garbo/jobs/scope1'

const followUpScope1 = new FollowUpWorker(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_1,
  async (job) => {
    const { url, previousAnswer } = job.data
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts)

    // Call pure function
    const answer = await extractScope1(url, markdown)

    // BullMQ-specific logic
    return answer
  },
)
```

### 3. Wrappers in `@garbo/mcp`

MCP tools are also thin wrappers that call the same pure functions:

```typescript
// packages/mcp/src/tools/extractScope1.ts
import { extractScope1 } from '@garbo/jobs/scope1'

export const extractScope1Tool = {
  name: 'extract_scope1',
  handler: async (input) => {
    const markdown = await getMarkdown(input.url)
    return await extractScope1(input.url, markdown)
  },
}
```

## Benefits

### For Development

- ✅ **No code duplication** - Same logic for BullMQ and MCP
- ✅ **Easier testing** - Pure functions are easy to test
- ✅ **Better separation** - Business logic vs infrastructure
- ✅ **Type safety** - Full TypeScript support with workspace references

### For Operations

- ✅ **Flexibility** - Use BullMQ with Discord UI OR MCP with AI agents
- ✅ **Scalability** - Easy to deploy packages independently
- ✅ **Reliability** - Tested code from existing BullMQ workers
- ✅ **Maintainability** - Single source of truth

### For AI Agents

- ✅ **Simple interface** - High-level tools that "just work"
- ✅ **Consistent behavior** - Same logic as production system
- ✅ **Rich output** - Structured data with Zod schemas
- ✅ **Error handling** - Clear error messages

## Migration Plan

### Phase 1: Setup Monorepo (Current)

- ✅ Create pnpm workspace structure
- ✅ Create package.json for all packages
- ✅ Create TypeScript configs with references
- ✅ Copy files to appropriate packages
- ✅ Create index files for exports

### Phase 2: Fix Imports

- Use ts-morph to update all imports
- Replace `@/` aliases with workspace package imports
- Example: `@/lib/openai` → `@garbo/shared/lib/openai`

### Phase 3: Make Jobs Pure

- Remove Discord UI logic from jobs
- Remove job chaining from jobs
- Extract pure functions to `@garbo/jobs`
- Update workers to call pure functions

### Phase 4: Update Workers

- Refactor workers to use `@garbo/jobs`
- Keep BullMQ-specific logic in workers
- Test that existing functionality works

### Phase 5: Update MCP

- Refactor MCP to use `@garbo/jobs`
- Remove duplicated code
- Test MCP tools

### Phase 6: Update API

- Refactor API to use `@garbo/jobs`
- Test API endpoints

### Phase 7: Cleanup

- Remove old `src/` directory
- Update documentation
- Deploy and test

## Example: Complete Flow

### Before (Current)

```typescript
// src/workers/followUp/scope1.ts
import { FollowUpWorker } from '../../lib/FollowUpWorker'
import { schema } from '../../jobs/scope1/schema'
import { prompt } from '../../jobs/scope1/prompt'
import { queryTexts } from '../../jobs/scope1/queryTexts'

const followUpScope1 = new FollowUpWorker(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_1,
  async (job) => {
    const { url, previousAnswer } = job.data
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts)

    const response = await askStreamWithContext(
      markdown,
      prompt,
      schema,
      'scope1',
    )

    return response
  },
)
```

### After (Proposed)

```typescript
// packages/workers/src/followUp/scope1.ts
import { FollowUpWorker } from '@garbo/shared/lib/FollowUpWorker'
import { extractScope1 } from '@garbo/jobs/scope1'

const followUpScope1 = new FollowUpWorker(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_1,
  async (job) => {
    const { url, previousAnswer } = job.data
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts)

    // Call pure function
    const result = await extractScope1(url, markdown)

    return result
  },
)
```

```typescript
// packages/jobs/src/scope1/extractScope1.ts
import { askStreamWithContext } from '@garbo/shared/lib/ai-utils'
import { schema } from './schema'
import { prompt } from './prompt'

export async function extractScope1(
  url: string,
  markdown: string,
): Promise<Scope1Result> {
  const response = await askStreamWithContext(
    markdown,
    prompt,
    schema,
    'scope1',
  )
  return schema.parse(JSON.parse(response))
}
```

```typescript
// packages/mcp/src/tools/extractScope1.ts
import { extractScope1 } from '@garbo/jobs/scope1'
import { getMarkdown } from '@garbo/shared/lib/vectordb'

export const extractScope1Tool = {
  name: 'extract_scope1',
  handler: async (input) => {
    const markdown = await getMarkdown(input.url)
    return await extractScope1(input.url, markdown)
  },
}
```

## Next Steps

1. **Review this proposal** - Does this structure make sense?
2. **Approve Phase 1** - The monorepo setup is ready
3. **Begin Phase 2** - Fix imports with ts-morph
4. **Test incrementally** - Build and test each package

## Questions

1. Should we keep the old `src/` directory during migration, or delete immediately?
2. Should we use ts-morph for import fixing, or do it manually?
3. Should we create a separate `@garbo/database` package for Prisma?
4. Should we keep Discord-specific code in `@garbo/shared` or create `@garbo/discord`?

## Status

- ✅ Monorepo structure created
- ✅ Package.json files created
- ✅ TypeScript configs created
- ✅ Files copied to packages
- ✅ Index files created
- ⏳ Imports need to be fixed
- ⏳ Jobs need to be made pure
- ⏳ Workers need to be updated
- ⏳ MCP needs to be updated
- ⏳ API needs to be updated
- ⏳ Testing needed

---

**Created:** 2026-02-04
**Branch:** feat/mcp
**Status:** Draft - Awaiting review
