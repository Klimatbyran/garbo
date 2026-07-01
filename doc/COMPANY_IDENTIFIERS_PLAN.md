# Company identifiers and non-blocking Wikidata

Plan for moving company identity off `wikidataId` as the sole primary key, introducing a flexible identifier model, and making the pipeline proceed without blocking on Wikidata approval.

**Repos involved**

| Repo                  | Role                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| **garbo**             | Prisma migrations (source of truth), workers, internal API                 |
| **API** (unearth-api) | Partner/integration/staff HTTP API — schema and handlers synced from garbo |
| **validate**          | Staff UI — editor, job approvals, overview                                 |
| **pipeline-api**      | Process/swimlane aggregation for Validate job status                       |

Garbo and unearth-api share one PostgreSQL database. Migrations run in garbo; unearth-api picks up schema + service changes when deployed.

---

## Background: what exists today

### Done (company internal id — step 1)

- `Company.id` (UUID) added and backfilled (`20260602120000_add_company_internal_id`).
- **unearth-api** staff routes use internal id: `POST /api/companies/`, `POST /api/companies/:id`.
- **unearth-api** read routes resolve wikidataId, full UUID, or 8-char UUID prefix.
- **validate** creates/updates companies by internal `id` via unearth-api.
- **garbo workers** still save via `/companies/${wikidataId}` and require `wikidata.node` before company creation.

### Still blocking

1. **`wikidataId` is still `@id`** on `Company`. Seven child tables FK to it.
2. **Pipeline flow**: in `precheck.ts`, `guessWikidata` is a **child** of `extractEmissions`. BullMQ runs children before the parent, so Wikidata approval (`moveToDelayed`) blocks emissions extraction, `checkDB`, and all saves.
3. **`checkDB`** creates companies keyed by `wikidata.node` and metadata `comment: 'Created by Garbo AI'`.

---

## Target model

### `CompanyIdentifier` table (not a JSON array)

Each row: `type` (enum), `value`, and standard `Metadata` (including `verifiedBy` for human review).

```prisma
enum CompanyIdentifierType {
  WIKIDATA
  LEI
  ORG_NUMBER
  ISIN
}

model CompanyIdentifier {
  id        String                @id @default(cuid())
  companyId String                // FK → Company.id (stable; survives PK flip)
  type      CompanyIdentifierType
  value     String
  company   Company               @relation(...)
  metadata  Metadata[]

  @@unique([companyId, type])
  @@index([type, value])
  @@map("company_identifiers")
}
```

`Metadata` gains `companyIdentifierId` (same pattern as `scope1Id`, `industryId`, etc.).

### Legacy columns (transition)

Keep `Company.wikidataId` and `Company.lei` during transition. **Dual-write**: identifier service updates both the table and legacy columns so partner API responses stay unchanged.

### Verification

| State                                    | `metadata.verifiedBy` | Typical `source`                                 |
| ---------------------------------------- | --------------------- | ------------------------------------------------ |
| Pipeline guess, not reviewed             | `null`                | `wikidata-search`, `override-wikidata-id`        |
| Auto-matched production DB               | optional bot / `null` | `production-database`                            |
| Human approved in Validate               | approver user id      | from approval                                    |
| Manual editor save with `verified: true` | editor user id        | `validate-editor`                                |
| Backfill from legacy columns             | `null`                | `legacy-company-wikidata` / `legacy-company-lei` |

Query “is Wikidata verified?” → `CompanyIdentifier` where `type = WIKIDATA` and latest metadata has non-null `verifiedBy`.

Do **not** attach company-creation metadata (`Created by Garbo AI`) to identifier rows.

### Partner / external API

No response shape change. `PartnerCompanyBase` keeps `id`, `wikidataId`, `lei` populated from legacy columns (dual-write). Do not expose `identifiers[]` on partner routes in early phases.

---

## Implementation phases

### Phase 1 — Identifier table + backfill + dual-write (garbo only)

**Scope:** garbo repo only. unearth-api sync happens before stage/prod deploy of API that reads new columns.

| Step | Work                                                                                 |
| ---- | ------------------------------------------------------------------------------------ |
| 1.1  | Prisma: `CompanyIdentifierType`, `CompanyIdentifier`, `Metadata.companyIdentifierId` |
| 1.2  | Migration SQL                                                                        |
| 1.3  | `companyIdentifierService` — upsert, sync from legacy columns                        |
| 1.4  | Dual-write in `companyService.upsertCompany`                                         |
| 1.5  | Include `identifiers` on internal/pipeline company detail reads + Zod schemas        |
| 1.6  | Backfill script `scripts/backfill-company-identifiers.ts`                            |
| 1.7  | Tests for identifier service and sync                                                |

**Exit criteria:** All companies have identifier rows for existing `wikidataId` / `lei`; new upserts keep table and columns in sync; internal GET returns `identifiers`.

### Phase 2 — Primary key flip (`Company.id`)

| Step | Work                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | Make `Company.id` the `@id`; `wikidataId` nullable `@unique`                                                                |
| 2.2  | Repoint FKs: `BaseYear`, `Industry`, `ReportingPeriod`, `Goal`, `Initiative`, `Description`, `CompanyReport` → `Company.id` |
| 2.3  | Rename `Industry.companyWikidataId` → `companyId`                                                                           |
| 2.4  | Data migration script + validation queries                                                                                  |
| 2.5  | Refactor `changeCompanyWikidataId` → identifier upsert (no PK rewrite)                                                      |
| 2.6  | Sync schema + services to unearth-api                                                                                       |
| 2.7  | Allow `POST /api/companies/` without `wikidataId`                                                                           |

**Gap:** Large migration; plan maintenance window or multi-step FK migration. unearth-api cannot serve companies without wikidata until this lands.

### Phase 3 — Non-blocking pipeline + worker URL migration (garbo)

| Step | Work                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 3.1  | **Restructure `precheck` flow** — `guessWikidata` must not be a child of `extractEmissions`                               |
| 3.2  | **`checkDB`** — create company via `POST /companies` (name only) → store `companyId` on job data                          |
| 3.3  | **`saveToAPI`** — use `/companies/${companyId}/...` (requires garbo staff routes aligned with unearth-api)                |
| 3.4  | **`guessWikidata`** — async; upsert unverified `WIKIDATA` identifier; on approval set `verifiedBy`; do not block pipeline |
| 3.5  | **`extractEmissions` / `extractLEI`** — work without approved Wikidata; LEI via GLEIF name search                         |
| 3.6  | **`companySaveLock`** — key by `company.id` not `wikidataId`                                                              |
| 3.7  | **Registry / `ReportRun`** — prefer `companyId` on job and archive rows                                                   |
| 3.8  | **`sendCompanyLink`** — link by internal id or resolved Wikidata                                                          |
| 3.9  | **Wikipedia/Wikidata upload workers** — only when verified Wikidata identifier exists                                     |

**Gap:** Garbo internal API still uses `/:wikidataId` routes; port staff `/:id` routes from unearth-api into garbo (or point workers at unearth-api) before changing worker URLs.

**Baseline shipped in Phase 3 (branch `1338-wikidataWorker`):** `resolveOrCreatePipelineCompanyId` in `src/lib/pipelineCompanyResolve.ts` — prefer `job.data.companyId`, then Wikidata Q-id lookup, then exact normalized name match after fuzzy DB search, else `POST /companies/`. No approval gate yet.

### Phase 3.5 — Company link resolution + Wikidata matching (deferred)

**Scope:** garbo + validate. Small middle step between Phase 3 and Phase 4. **Paused for now** — implement when ambiguous matches show up in stage/prod, or before a large batch run where wrong `companyId` would be costly.

**Problem:** Phase 3 auto-links only when exactly one Garbo row has the same normalized name as the name extracted from the report. Fuzzy search can return several candidates (e.g. ICA Sweden vs ICA Finland) while the PDF gives a short generic name (`"ICA"`). Today that falls through to **create a new company** rather than silently linking to the wrong row — but duplicates and manual cleanup are still possible.

**Name source for matching (unchanged from Phase 3):** LLM extraction from report markdown in `precheck`, or `job.data.companyName` when set by pipeline-api / staff. Wikidata labels are **not** used for name matching; Wikidata is a separate resolution path via `job.data.wikidata.node` when present on the job (typical on re-runs).

| Step | Work                                                                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.5.1 | **Ambiguity heuristics** — pure function on fuzzy search candidates + extracted name: multiple exact matches; multiple fuzzy hits + short/generic name (e.g. one token or ≤4 chars); optional shared-prefix rule for ICA-style cases |
| 3.5.2 | **`precheck` approval gate** — when ambiguous, `requestApproval('companyLink', { extractedName, candidates })`, `moveToDelayed`; on approve read `companyId` (or explicit “create new”) from `approval.data.newValue` before spawning children |
| 3.5.3 | **Validate `CompanyLinkApprovalDisplay`** — radio list of candidates (`id`, `name`, `wikidataId` if any) plus “Create new company”; mirror `WikidataApprovalDisplay` + `useJobRerunActions` approve/rerun pattern |
| 3.5.4 | **Observability (optional, ~2–3 h)** — log/metric when candidates exist but no single exact match (measures how often the gate would fire without blocking yet)                                      |
| 3.5.5 | **Re-run contract** — document/enforce pipeline-api passing `companyId` or `wikidataId` when re-processing a known company (most reliable path; name-only remains fallback)                            |
| 3.5.6 | **Tests** — unit tests for heuristics; precheck approval resume path; Validate parser for `approval.type === 'companyLink'`                                                                          |

**Repos / changes:**

| Repo | Work |
| ---- | ---- |
| **garbo** | `pipelineCompanyResolve.ts`, `precheck.ts`, tests |
| **validate** | `CompanyLinkApprovalDisplay`, `job-specific-data-parsing.ts`, `JobSpecificDataView`, i18n |
| **pipeline-api** | No schema changes expected; existing `/rerun` deep-merge of `approval` is sufficient |

**Trigger policy (recommended v1):** ask human only when `candidates.length > 1` and there is not exactly one exact normalized name match. Most runs never hit the gate.

**Effort (estimate):** ~1.5–2 dev days for scoped MVP; +0.5 day for swimlane copy, candidate detail links, and polish.

**Exit criteria:** Ambiguous extractions block in `precheck` until staff pick a company or confirm create-new; chosen `companyId` flows to all downstream workers; no silent wrong-country link on multi-candidate cases covered by heuristics.

**Not in scope:** LLM-based company disambiguation, fuzzy auto-link without human approval, or registry-driven name resolution.

### Phase 4 — Validate UI + verification UX

| Step | Work                                                                        |
| ---- | --------------------------------------------------------------------------- |
| 4.1  | `CompanyDetailTab` — identifiers list with verification badges              |
| 4.2  | `companies-api` / schemas — parse `identifiers`                             |
| 4.3  | `WikidataApprovalDisplay` — on approve, persist verified identifier via API |
| 4.4  | Swimlane — “Wikidata unverified” vs “pipeline blocked”                      |
| 4.5  | Overview/registry — handle null `wikidataId` where applicable               |

### Phase 5 — Deprecation (later)

Remove legacy `lei` / direct `wikidataId` columns when all consumers use identifiers.

### Phase 6 — Metadata history + `previousValue` (separate PR)

**Scope:** Own PR(s), independent of identifier/pipeline phases. Partner/Bolt contract unchanged — staff/pipeline reads and internal write paths only.

**Goal:** Every new `Metadata` row can record what changed, and Validate can show full audit history (not just the latest snapshot).

#### Schema

| Step | Work                                                              |
| ---- | ----------------------------------------------------------------- |
| 6.1  | Add `Metadata.previousValue Json?` (nullable; old rows stay null) |
| 6.2  | Migration in garbo; sync schema to unearth-api                    |

Use `Json` so one field covers strings (Wikidata Q-id), numbers (scope 1 total), and partial objects (scope 2 `mb` / `lb` / `unknown`).

#### Shared write helper

| Step | Work                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| 6.3  | Extend `metadataService.createMetadata` (or add `createMetadataForChange`) to accept optional `previousValue`  |
| 6.4  | Optional helper to compare before/after payloads and derive `previousValue` only when a field actually changed |

#### Wire all metadata-creating write paths

Apply globally, not identifiers-only. Incremental rollout within the PR is fine; schema ships once.

| Area | Work                                                                                                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.5  | **Identifiers** — pass `existing.value` when identifier value changes                                                                                                                                    |
| 6.6  | **Industry, goals, initiatives, base year, descriptions** — load existing, compare, create metadata with `previousValue`                                                                                 |
| 6.7  | **Reporting periods / emissions / economy** — refactor so each **changed datapoint** gets its own metadata row with its own `previousValue` (not one shared `createdMetadata` per period for all fields) |
| 6.8  | **`emissionsService` upserts** — read current row before update; set `previousValue` on value change                                                                                                     |
| 6.9  | Pipeline saves — covered once staff POST handlers populate `previousValue`                                                                                                                               |

**Note:** Historical rows cannot be backfilled with previous values; this is forward-looking from deploy date.

#### Internal reads + Validate UI

| Step | Work                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| 6.10 | Add `metadataHistoryArgs` (no `take: 1`) alongside existing `metadataArgs` on **pipeline/staff detail** queries only         |
| 6.11 | `transformMetadata` — keep `metadata` as latest; expose `metadataHistory` as array                                           |
| 6.12 | Extend `InternalCompanyDetails` / nested Zod schemas with optional `metadataHistory` and `previousValue` on `MetadataSchema` |
| 6.13 | Validate `MetadataDetailsDialog` — timeline UI showing source, user, verifiedBy, `previousValue` → current field value       |
| 6.14 | Sync garbo + unearth-api                                                                                                     |

**Do not change:** `PartnerCompanyList`, `PartnerCompanyDetails`, or Bolt-facing routes.

#### Exit criteria

- New saves attach `previousValue` when a datapoint value changes (all staff write paths).
- `GET /api/pipeline/companies/:ref` returns `metadataHistory` on nested fields.
- Validate metadata modal shows history including previous values where present.
- Partner API responses byte-identical in shape (no new fields on partner schemas).

#### Effort (estimate)

~2–3 weeks total; reporting-period refactor is the bulk of the work.

---

## Gaps and cross-cutting concerns

Document these in each phase so they are not lost.

### garbo ↔ unearth-api drift

Workers call garbo's `API_BASE_URL`. unearth-api is ahead on internal-id staff routes. Before Phase 3, align garbo `company.update` / read routes with unearth-api `staff/` handlers.

### Migrations owned by garbo only

unearth-api README: schema errors usually mean garbo migrations are not applied. Run backfill on staging before prod API deploy.

### FK migration scope (Phase 2)

Seven relations reference `wikidataId` today:

- `BaseYear.companyId`
- `Industry.companyWikidataId`
- `ReportingPeriod.companyId`
- `Goal.companyId`
- `Initiative.companyId`
- `Description.companyId`
- `CompanyReport.companyId`

Plus optional `wikidataId` on `Report`, `ReportRun`, `ReportRunJob` (not FK to Company PK).

### Search alignment

garbo `getAllCompaniesBySearchTerm` orders by `wikidataId`; unearth-api searches by `id`. Align when flipping PK.

### Concurrent pipeline runs

`companySaveLock` and registry identity must use stable `companyId` after Phase 2/3.

### Tests to add/update

- `companyIdentifierService` unit tests
- `companyService.wikidata` / upsert sync tests
- `saveToAPI.test.ts` (Phase 3)
- `CompanyDetailTab.test.tsx` (Phase 4)
- Pipeline flow integration tests (Phase 3)
- `pipelineCompanyResolve` ambiguity heuristics + `precheck` company-link approval (Phase 3.5)
- `metadataService` / reporting-period save tests (Phase 6)

### Registry placeholder names (related uncommitted work)

Local changes to `registryReportIdentity.ts` / `registryService.ts` fix merging `"Unknown"` company names from pipeline into registry rows. Orthogonal to identifiers but useful for Phase 3; commit or merge separately.

---

## Pipeline flow (current vs target)

### Current (blocking)

```
precheck
  └── extractEmissions (parent — waits for children)
        ├── guessWikidata  ← blocks on approval
        └── followUpFiscalYear
  └── extractEmissions runs follow-ups → checkDB → diff* → saveToAPI
```

### Target (non-blocking)

```
precheck
  ├── create/find company by internal id (early)
  ├── extractEmissions + follow-ups → checkDB → diff* → saveToAPI  (uses companyId)
  └── guessWikidata (parallel / async) → upsert WIKIDATA identifier when known/approved
```

---

## Phase 1 runbook

```bash
# After merge to environment with DB access:
npx prisma migrate deploy

# Backfill (staging first):
npx tsx scripts/backfill-company-identifiers.ts --dry-run
npx tsx scripts/backfill-company-identifiers.ts
```

Backfill sets legacy `source` / `comment` on metadata only (`verifiedBy` stays null). Wikidata and LEI use separate sources — see `scripts/backfill-company-identifiers.ts`.

Verify:

```sql
SELECT COUNT(*) FROM "Company";
SELECT COUNT(*) FROM "company_identifiers" WHERE type = 'WIKIDATA';
SELECT c."wikidataId", i.value
FROM "Company" c
LEFT JOIN "company_identifiers" i ON i."companyId" = c.id AND i.type = 'WIKIDATA'
WHERE c."wikidataId" IS NOT NULL AND (i.value IS NULL OR i.value <> c."wikidataId");
```

---

## unearth-api sync checklist (post Phase 1)

When deploying API against a DB with Phase 1 migration:

- [ ] Copy Prisma schema changes
- [ ] Copy `companyIdentifierService`
- [ ] Dual-write in `companyService.upsertCompany`
- [ ] `identifiers` on staff/pipeline detail responses + Zod schemas
- [ ] `npx prisma generate` in API repo (no new migration in API)

---

## References

- `prisma/schema.prisma` — `Company`, `Metadata`
- `src/lib/pipelineCompanyResolve.ts` — company id resolve-or-create (Phase 3); ambiguity gate (Phase 3.5)
- `src/workers/precheck.ts` — flow construction; company-link approval (Phase 3.5)
- `src/workers/guessWikidata.ts` — approval blocking
- `src/workers/checkDB.ts` — company creation
- `doc/pipeline.md` — worker documentation
- unearth-api `README.md` — Relationship to Garbo
