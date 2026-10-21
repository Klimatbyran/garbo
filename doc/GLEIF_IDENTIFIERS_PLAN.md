# GLEIF-linked company identifiers (ISIN, ORG_NUMBER, BIC)

Collect **all clear LEI-linked identifiers** from the official GLEIF API after a company has an LEI. Prefer blank over guessing. No LLM.

**Repos**

| Repo | Role |
| ---- | ---- |
| **garbo** | Migrations (source of truth), GLEIF client, workers, write policy, backfill |
| **api** (unearth-api) | Schema sync, identifier upsert/batch, validation, resolve-by-value |
| **pipeline-api** | Queue names + non-blocking failure |
| **Goffer** | Swimlane / `runOnly`, editor types for multi-ISIN + BIC |

Validate approval UI for picking a “primary” ISIN among many is **out of scope** (editor can set `role=PRIMARY` later).

---

## Goals

1. When a company has a **valid LEI**, enrich from GLEIF:
   - **All ISINs** linked to that LEI (for clients to choose from)
   - **ORG_NUMBER** from `entity.registeredAs` (0 or 1 per LEI)
   - **All BICs** from the LEI record (`bic[]`)
2. Never invent values; never use an LLM for this step.
3. Never overwrite staff/verified choices incorrectly.
4. Backfill existing companies that already have LEI.

---

## Source of truth

| Data | GLEIF endpoint / field | Auth |
| ---- | ---------------------- | ---- |
| ISINs | `GET /lei-records/{lei}/isins` | None |
| Org number | `GET /lei-records/{lei}` → `entity.registeredAs` | None |
| BIC(s) | same LEI record → `bic` (array) | None |

- Rate limit ~60 req/min (throttle backfill).
- GLEIF does **not** classify ISINs (no equity/bond type). Instrument class would need another source later.
- Coverage of ISIN↔LEI mapping depends on participating NNAs; some LEIs have 0 ISINs.

---

## Schema

Keep one `company_identifiers` table (API already returns `identifiers[]`). Allow multiple rows per type for multi-valued IDs.

```prisma
enum CompanyIdentifierType {
  WIKIDATA
  LEI
  ORG_NUMBER
  ISIN
  BIC
}

enum CompanyIdentifierRole {
  PRIMARY
}

model CompanyIdentifier {
  id        String                 @id @default(cuid())
  companyId String
  type      CompanyIdentifierType
  value     String
  /// PRIMARY = canonical value for UI/summary when type allows many (ISIN).
  role      CompanyIdentifierRole?
  company   Company                @relation(...)
  metadata  Metadata[]

  @@unique([companyId, type, value])
  @@index([type, value])
  @@index([companyId, type])
  @@map("company_identifiers")
}
```

SQL also: partial unique index — at most one `PRIMARY` per `(companyId, type)`.

| Type | Cardinality | App rule |
| ---- | ----------- | -------- |
| WIKIDATA, LEI, ORG_NUMBER | Singular | Upsert replaces / rejects second value |
| ISIN, BIC | Multi | Many rows; optional one `PRIMARY` |

Partner API: **unchanged** (still no `identifiers[]` / ISIN on partner responses).

---

## Write policy (foolproof)

Pipeline metadata: `verifiedBy = null`, `source = gleif-lei-record` / `gleif-lei-isins`.

### ISIN

| Situation | Action |
| --------- | ------ |
| 0 valid ISINs | Write nothing |
| 1..MAX valid ISINs (MAX=100) | **Upsert all** values not already on this company; skip values owned by another company |
| \> MAX ISINs (e.g. banks with 100k+) | **Write nothing** for ISIN; log count (avoid blowing up DB on mega-issuers). Backfill can raise `--max-isins`. |
| Exactly 1 ISIN and no existing PRIMARY | Set `role=PRIMARY` on that row |
| 2+ ISINs | Store all; **do not** auto-set PRIMARY (clients/staff choose) |
| Existing PRIMARY | Never auto-change or clear |
| Existing ISIN row same value | Skip (idempotent) |

### ORG_NUMBER (`registeredAs`)

| Situation | Action |
| --------- | ------ |
| Missing / blank | Leave blank |
| Company already has ORG_NUMBER | Never overwrite |
| Clear non-empty `registeredAs` and company has none | Write singular ORG_NUMBER |
| Owned by another company | Skip |

No jurisdiction filter required for v1: value comes from the certified LEI record for *this* LEI. Format varies by country (expected).

### BIC

| Situation | Action |
| --------- | ------ |
| 0 BICs | Leave blank |
| 1+ BICs | Upsert all (same ownership / idempotent rules as ISIN) |
| Exactly 1 BIC and no PRIMARY | Optional `role=PRIMARY` |
| 2+ BICs | Store all; no auto-PRIMARY |

Invalid checksum / format → reject that value only.

---

## Pipeline flow

```
extractLEI (existing)
  → checkDB merges LEI
  → if LEI known:
        extractGleifIds   (GLEIF record + isins; no LLM)
          → diffGleifIds  (apply write policy)
            → saveToAPI   POST .../identifiers/batch
```

- Non-blocking (`failParentOnFailure: false`; pipeline-api `NON_BLOCKING_FAILURE_QUEUES`).
- Enqueued from `checkDB` after LEI resolution (same-run LEI available).
- `runOnly`: `gleifIds` (and trigger when `lei` / full run).
- Replaces the earlier single-ISIN-only `extractISIN` / `diffISIN` naming on this branch.

---

## API surface (staff / pipeline)

- `POST /api/companies/:id/identifiers` — still upserts one row; keyed by `(type, value)` for multi types; optional `role`.
- `POST /api/companies/:id/identifiers/batch` — `{ items: [{ type, value, role? }], metadata?, verified? }` for pipeline.
- `DELETE /api/companies/:id/identifiers/:type` — clears all of that type (singular or multi).
- Optional later: `DELETE .../:type/:value` for one ISIN/BIC.
- Resolve company by ISIN / LEI / BIC / ORG_NUMBER where useful for ownership checks.

---

## Backfill

`scripts/backfill-gleif-identifiers.ts`

```bash
npx tsx scripts/backfill-gleif-identifiers.ts --dry-run
npx tsx scripts/backfill-gleif-identifiers.ts --limit=50
npx tsx scripts/backfill-gleif-identifiers.ts --max-isins=100
```

Select companies with LEI and missing GLEIF-linked rows (or always refresh additive ISINs/BICs). Throttle ~50 LEI lookups/min. Same write policy as pipeline.

---

## Goffer

- Types: add `BIC`; allow multiple editor rows for `ISIN` / `BIC`.
- Summary: prefer `role=PRIMARY` ISIN, else list count / first.
- Swimlane: `extractGleifIds` / `diffGleifIds`; `runOnly` id `gleifIds`.

---

## Out of scope

- Validate multi-ISIN “pick primary” approval UI
- Partner exposure of identifiers
- ISIN instrument classification (CFI / equity vs bond)
- OpenCorporates / S&P / GEM / QCC mappings
- LLM selection

---

## Exit criteria

1. Companies with LEI get additive ISIN/BIC/ORG_NUMBER rows from GLEIF when clear.
2. Multi-ISIN issuers store the list (≤ MAX) without auto-PRIMARY.
3. Mega-issuers (> MAX ISINs) stay blank for ISIN rather than dumping 100k+ rows.
4. Existing PRIMARY / ORG_NUMBER never auto-overwritten.
5. Partner API response shape unchanged.
6. Backfill script can enrich historical LEI companies.
