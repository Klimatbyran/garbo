# ISIN (and LEI-linked identifiers) collection

Plan for enriching companies with ISIN from an official LEI→ISIN mapping, without guessing when the mapping is ambiguous.

**Repos**

| Repo | Role |
| ---- | ---- |
| **garbo** | Workers, GLEIF client, write policy, backfill script, docs |
| **api** (unearth-api) | Persist `CompanyIdentifier` type `ISIN` with checksum validation |
| **pipeline-api** | Queue names + non-blocking failure for ISIN extract |
| **Goffer** | Swimlane labels + `runOnly` worker id `isin` |

Validate UI approval screens are **out of scope** for this phase (editor already supports manual ISIN).

---

## Background

- `CompanyIdentifierType.ISIN` and staff upsert (`POST /api/companies/:id/identifiers`) already exist.
- Schema allows **one** ISIN per company (`@@unique([companyId, type])`).
- LEI is collected by `extractLEI` → `checkDB` → `diffLEI` (GLEIF + optional Wikidata P1278).
- Many LEIs map to **0 or N** ISINs (equity + bonds + dual listings). Example: Heidelberg Materials LEI → 4 ISINs.

---

## Source of truth (do not invent)

Use the **official GLEIF API** (free, no auth, CC0 LEI data + ANNA mapping):

```
GET https://api.gleif.org/api/v1/lei-records/{LEI}/isins
```

| Property | Detail |
| -------- | ------ |
| Auth | None |
| Rate limit | ~60 req/min (respect in backfill) |
| Coverage | Participating NNAs; not every security historically |
| LLM | **Not used** — LEI→ISIN is deterministic |

Do **not** scrape commercial data vendors. Optional later: Wikidata P946 only as a hint, never as sole auto-write when GLEIF is empty/ambiguous.

Daily GLEIF ISIN–LEI zip files are an alternative for bulk backfill; v1 uses the per-LEI API for simplicity.

---

## Write policy (foolproof)

We store at most one ISIN. Wrong company is worse than blank.

| GLEIF result | Action |
| ------------ | ------ |
| 0 ISINs | Leave blank |
| **Exactly 1** valid ISIN | Auto-write if company has no ISIN and no other company owns it |
| **2+** ISINs | Leave blank; log candidates (staff can pick in editor later) |
| Existing ISIN on company | Never auto-overwrite |
| ISIN owned by another company | Skip (409-equivalent) |
| Invalid checksum | Reject |

Pipeline metadata: `verifiedBy = null`, `source = gleif-lei-isins`. Staff can verify in the editor.

**No approval gate in v1.** Ambiguous cases stay blank (non-blocking). A future Validate approval step can present candidates; not required to ship collection.

---

## Pipeline flow

```
extractLEI (existing, non-blocking)
  → checkDB merges LEI
  → if LEI known (extracted or already on company):
        extractISIN  (GLEIF by LEI)
          → diffISIN (ownership / uniqueness)
            → saveToAPI POST .../identifiers { type: ISIN, value }
```

- `extractISIN` / `diffISIN` are **non-blocking** (same as LEI): failures must not fail the run.
- Enqueue from `checkDB` after LEI resolution (not as a sibling of `extractLEI`), so the same run’s new LEI is available.
- `runOnly: ['isin']` reuses company LEI from DB; `runOnly: ['lei']` also triggers ISIN when a LEI is present after the run.

---

## Persistence

- Write via existing staff route: `POST /api/companies/:id/identifiers`
- Body: `{ type: "ISIN", value, metadata: { source: "gleif-lei-isins", comment: "..." }, verified: false }`
- No new Prisma migration (enum already has `ISIN`).
- Partner API unchanged (no `isin` / `identifiers[]` on partner responses).

---

## Backfill

Script: `garbo/scripts/backfill-isin-from-lei.ts`

1. Select companies with LEI (column or identifier) and **no** ISIN identifier.
2. Call GLEIF per LEI with throttling (~50/min).
3. Apply the same write policy (exactly one → upsert; else skip).
4. `--dry-run` prints would-write / skip reasons.

```bash
npx tsx scripts/backfill-isin-from-lei.ts --dry-run
npx tsx scripts/backfill-isin-from-lei.ts
```

---

## Cross-repo checklist

### garbo
- [x] Plan doc (this file)
- [x] `getIsinsForLei` in `src/lib/gleif.ts`
- [x] `normalizeIsin` / checksum helpers
- [x] `decideIsinWrite` (mirror `leiOwnership`)
- [x] Workers `extractISIN`, `diffISIN`
- [x] `checkDB` enqueue when LEI known
- [x] Queue names + `FOLLOW_UP_KEYS` / `runOnly` key `isin`
- [x] Backfill script + unit tests

### api
- [x] Shared `normalizeIsin` + validate on identifier upsert
- [x] Conflict check for ISIN (already generic by type/value)
- [x] Resolve company by ISIN (and LEI) on pipeline reads

### pipeline-api
- [x] `EXTRACT_ISIN`, `DIFF_ISIN` in `QUEUE_NAMES`
- [x] Add `extractISIN` to `NON_BLOCKING_FAILURE_QUEUES`

### Goffer
- [x] `runOnly` worker `isin`
- [x] Swimlane display names for `extractISIN` / `diffISIN`
- [x] Non-blocking set includes `extractISIN`

---

## Out of scope (later)

- Validate approval UI for multi-ISIN candidate pick
- Multiple ISINs per company (schema change)
- Partner API exposure of ISIN
- ORG_NUMBER auto-enrichment
- Bulk zip ingest from GLEIF daily files
- `missing-isin` manual-review flag

---

## Exit criteria

1. New pipeline runs with a unique GLEIF ISIN persist an unverified `ISIN` identifier.
2. Multi-ISIN LEIs leave ISIN blank (no wrong guess).
3. Existing ISINs are never overwritten by the pipeline.
4. Backfill script can enrich historical companies with the same rules.
5. Partner/public API response shape unchanged.
