# Monorepo Refactoring - Progress Report

## Status: Phase 2 In Progress

### ✅ Completed

1. **Phase 1: Monorepo Structure** ✓

   - Created pnpm workspace
   - Created 6 packages (schemas, shared, jobs, workers, api, mcp)
   - Copied all code to packages (~127,000 lines)
   - Set up TypeScript project references

2. **Phase 2: Import Refactoring** (Mostly Complete)

   - Created ts-morph refactoring script
   - Refactored all @/ imports to workspace imports
   - Examples:
     - `@/lib/openai` → `@garbo/shared/lib/openai`
     - `@/jobs/scope1/schema` → `@garbo/jobs/scope1/schema`
     - `@/api/schemas` → `@garbo/schemas`
   - Installed all package dependencies
   - Added `composite: true` to all tsconfig.json

3. **Build Status**
   - ✅ `@garbo/schemas` - Builds successfully
   - ⚠️ `@garbo/shared` - TypeScript errors (wikibase-sdk types)
   - ⚠️ `@garbo/jobs` - TypeScript errors (duplicate exports, missing modules)
   - ⚠️ `@garbo/workers` - TypeScript errors (missing imports)
   - ⚠️ `@garbo/api` - TypeScript errors (Prisma types, missing imports)
   - ⚠️ `@garbo/mcp` - TypeScript errors (missing imports)

### 🔧 Remaining Issues

#### 1. TypeScript Errors

**@garbo/shared:**

- wikibase-sdk type definitions missing
- Need to add `// @ts-ignore` or fix types

**@garbo/jobs:**

- Duplicate exports in index.ts (scope1, scope2, scope3 all export same names)
- Missing `promptTestingFramework` module
- Missing imports in `extractWithAI.ts`

**@garbo/workers:**

- Relative imports need to be fixed (e.g., `../lib/DiscordWorker` → `@garbo/shared/lib/DiscordWorker`)
- Missing `queues` module (needs to be moved to workers package)

**@garbo/api:**

- Prisma types not generated (need to run `prisma generate`)
- Relative imports need to be fixed

**@garbo/mcp:**

- Import paths need to be fixed

#### 2. Missing Modules

The following modules need to be moved or created:

- `queues.ts` - Currently in `src/`, needs to be in `@garbo/workers`
- `promptTestingFramework` - Currently in `src/jobs/`, needs to be in `@garbo/jobs`

### 📋 Next Steps

#### Phase 2b: Fix TypeScript Errors

1. **Fix @garbo/shared**

   - Add `// @ts-ignore` for wikibase-sdk type issues
   - Or install proper type definitions

2. **Fix @garbo/jobs**

   - Resolve duplicate exports in index.ts
   - Move `promptTestingFramework` to jobs package
   - Fix imports in `extractWithAI.ts`

3. **Fix @garbo/workers**

   - Replace relative imports with workspace imports
   - Move `queues.ts` to workers package
   - Fix all import paths

4. **Fix @garbo/api**

   - Generate Prisma client: `cd packages/api && npx prisma generate`
   - Replace relative imports with workspace imports
   - Fix Prisma type imports

5. **Fix @garbo/mcp**
   - Fix import paths

#### Phase 3: Make Jobs Pure

Once builds are working:

1. Remove Discord UI logic from jobs
2. Remove job chaining from jobs
3. Ensure jobs are pure functions (input → output)

#### Phase 4: Update Workers

1. Refactor workers to use `@garbo/jobs`
2. Keep BullMQ-specific logic in workers
3. Test that existing functionality works

#### Phase 5: Update MCP

1. Refactor MCP to use `@garbo/jobs`
2. Remove duplicated code
3. Test MCP tools

#### Phase 6: Update API

1. Refactor API to use `@garbo/jobs`
2. Test API endpoints

#### Phase 7: Cleanup

1. Remove old `src/` directory
2. Update documentation
3. Deploy and test

### 📊 Statistics

- **Total files:** ~310 TypeScript files
- **Total lines:** ~127,000
- **Packages:** 6
- **Commits:** 4
- **Branch:** `feat/mcp`

### 🎯 Key Achievements

1. ✅ Monorepo structure created
2. ✅ All code migrated to packages
3. ✅ Import refactoring completed
4. ✅ Dependencies installed
5. ✅ TypeScript project references set up
6. ✅ Schemas package builds successfully

### 💡 Notes

The monorepo structure is solid. The remaining TypeScript errors are mostly:

1. Type definition issues with third-party libraries (wikibase-sdk)
2. Import path issues that need to be fixed
3. Missing modules that need to be moved

These are all fixable and don't affect the overall architecture.

---

**Created:** 2026-02-04
**Branch:** feat/mcp
**Status:** Phase 2b - Fixing TypeScript errors
