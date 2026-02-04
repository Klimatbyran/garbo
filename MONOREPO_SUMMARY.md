# Monorepo Refactoring - Summary

## What Has Been Done

I've successfully created a monorepo structure for the Garbo project using pnpm workspaces. Here's what's been completed:

### ✅ Completed Tasks

1. **Monorepo Structure Created**

   - `pnpm-workspace.yaml` configured
   - Root `package.json` updated
   - All packages created with proper dependencies

2. **Packages Created**

   - `@garbo/schemas` - Shared Zod schemas
   - `@garbo/shared` - Shared utilities (lib, config, prompts)
   - `@garbo/jobs` - Pure job definitions
   - `@garbo/workers` - BullMQ workers
   - `@garbo/api` - Fastify API + Database
   - `@garbo/mcp` - MCP Server

3. **Files Copied**

   - All existing code copied to appropriate packages
   - ~127,000 lines of code migrated
   - 310 files created

4. **TypeScript Configuration**

   - Individual `tsconfig.json` for each package
   - Project references set up for type safety
   - Workspace dependencies configured

5. **Documentation**
   - `MONOREPO_PROPOSAL.md` - Comprehensive proposal document
   - Includes architecture diagrams, migration plan, examples

## Current Status

### Branch: `feat/mcp`

### Commits:

1. `448754e1` - MCP server structure and documentation
2. `f7e0d88e` - Monorepo structure with pnpm workspaces

### Package Structure:

```
packages/
├── schemas/      # Common Zod schemas
├── shared/       # Shared utilities (lib, config, prompts)
├── jobs/         # Pure job definitions (scope1, scope2, scope3, etc.)
├── workers/      # BullMQ workers
├── api/          # Fastify API + Prisma
└── mcp/          # MCP Server
```

## What's Next

### Phase 2: Fix Imports (Next Step)

- Use ts-morph to update all imports
- Replace `@/` aliases with workspace package imports
- Example: `@/lib/openai` → `@garbo/shared/lib/openai`

### Phase 3: Make Jobs Pure

- Remove Discord UI logic from jobs
- Remove job chaining from jobs
- Extract pure functions to `@garbo/jobs`

### Phase 4: Update Workers

- Refactor workers to use `@garbo/jobs`
- Keep BullMQ-specific logic in workers

### Phase 5: Update MCP

- Refactor MCP to use `@garbo/jobs`
- Remove duplicated code

### Phase 6: Update API

- Refactor API to use `@garbo/jobs`

### Phase 7: Cleanup

- Remove old `src/` directory
- Update documentation
- Deploy and test

## Key Benefits

1. **No Code Duplication** - Same logic for BullMQ and MCP
2. **Easier Testing** - Pure functions are easy to test
3. **Better Separation** - Business logic vs infrastructure
4. **Type Safety** - Full TypeScript support with workspace references
5. **Flexibility** - Use BullMQ OR MCP with same codebase

## Documentation

See `MONOREPO_PROPOSAL.md` for:

- Detailed architecture
- Migration plan
- Before/after examples
- Dependency graph
- Questions and next steps

## Files to Review

1. `MONOREPO_PROPOSAL.md` - Main proposal document
2. `pnpm-workspace.yaml` - Workspace configuration
3. `packages/*/package.json` - Package configurations
4. `packages/*/tsconfig.json` - TypeScript configurations

## Ready for Review

The monorepo structure is ready for your review. Please check:

1. Does the package structure make sense?
2. Are the dependencies correct?
3. Should we proceed with Phase 2 (fixing imports)?

Once approved, I'll proceed with fixing imports using ts-morph.
