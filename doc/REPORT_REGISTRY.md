# Report Registry

The `Report` table is a catalog of PDF documents (mainly annual and sustainability reports) that Garbo has ingested or discovered. It powers the registry tab in Validate and is the source of truth for report metadata (URL, S3 location, sha256, year).

## URL field semantics

A `Report` row has three URL-like columns:

| Field | Meaning | Notes |
|---|---|---|
| `url` | The primary unique identifier for this report. Prefer the web/link URL when known; fall back to the S3 URL when the report came from a file upload with no web source. | **Required, unique.** Do not assume it is always a web URL — use `isLikelyStoredObjectUrl` to detect S3/CDN values. `upgradeToWebUrlIfAvailable` upgrades it from S3 to a web URL when a better one arrives later. |
| `sourceUrl` | The web/link URL — where the report lives publicly. Always stored when known, even if it equals `url`. | Nullable. `null` means the report was uploaded as a file with no associated web link. |
| `s3Url` | The S3/CDN cached copy of the PDF. | Nullable. All newly ingested reports will have this set. Legacy rows may be `null`. Partial unique index: two rows cannot share the same non-null value. |

**Rule of thumb:** `url = sourceUrl ?? s3Url`. `sourceUrl` tells you whether the report has a known public web link. `s3Url` tells you whether we have a cached copy.

### How rows are created

**Crawler / link path** — report discovered or submitted via a web link:
```
{ url: "https://company.com/report-2024", sourceUrl: "https://company.com/report-2024", s3Url: "https://storage.googleapis.com/garbo-reports/x.pdf", sha256: "…" }
```

**File upload path** — report submitted as a file, no web link:
```
{ url: "https://storage.googleapis.com/garbo-reports/x.pdf", sourceUrl: null, s3Url: "https://storage.googleapis.com/garbo-reports/x.pdf", sha256: "…" }
```

**Legacy / crawler-only rows** (pre-S3 pipeline, still in production data) — no S3 copy yet:
```
{ url: "https://company.com/report-2024", sourceUrl: null, s3Url: null }
```

**Old pipeline rows** (pre-fix, still in production data) — S3 URL was incorrectly stored in `url`:
```
{ url: "https://storage.googleapis.com/garbo-reports/x.pdf", sourceUrl: "https://company.com/report-2024", s3Url: null }
```
The dedup script and `upgradeToWebUrlIfAvailable` normalise these over time.

## Duplicate prevention

### upsertReportInRegistry

`registryService.upsertReportInRegistry` looks up existing rows with an OR query across all four identity fields before deciding to create or update. This prevents duplicates when the crawler and the pipeline write to different columns for the same document.

The OR query (built by `buildReportLookupOr`) checks:
- `sha256` match
- `sourceUrl` match
- `url` match
- `s3Url` match
- **Cross-link:** `existing.url = input.sourceUrl` — finds crawler rows (stored under `url`) when the pipeline sends the same URL in `sourceUrl`
- **Cross-link:** `existing.sourceUrl = input.url` — reverse case

If multiple rows match (existing duplicates), `upsertReportInRegistry` merges them in a transaction: the richest row (most non-null identity fields) is the survivor; fields from the losers are null-coalesced onto the survivor; losers are deleted.

### pickRegistryPayloadFromReportingPeriodsSave

When the pipeline approves a reporting-periods save, `saveToAPI` calls this function to build the registry payload with consistent field routing:

1. **`url`** — `sourceUrl` when available (web/link), otherwise `s3Url` (file upload). Always set.
2. **`sourceUrl`** — always stored when a non-S3 HTTP URL is known, even if it equals `url`.
3. **`s3Url`** — always stored when an S3/CDN copy is available.
4. **`sha256`** — from `pdfCache.sha256` or `chosen.reportSha256`.

The web URL is resolved in priority order: `chosen.reportURL` (if not S3) → `job.data.sourceUrl` (if HTTP and not S3) → `canonicalPublicReportUrl(url, sourceUrl)`. The S3 URL is resolved from: `chosen.reportS3Url` → `pdfCache.publicUrl` → `job.data.url` if it looks like a storage URL.

## Deduplication script (one-off cleanup)

`scripts/dedupe-report-registry.ts` merges existing duplicate rows that were created before the upsert fix. It uses union-find to cluster rows that share any identity field, including the `url ↔ sourceUrl` cross-link that `upsertReportInRegistry` now handles at write time.

```bash
# Dry-run — shows what would be merged, writes nothing
npx tsx scripts/dedupe-report-registry.ts --dry-run

# Live run — merges rows, invalidates Redis cache
npx tsx scripts/dedupe-report-registry.ts

# Live run + emit survivor map CSV
npx tsx scripts/dedupe-report-registry.ts --emit-mapping=./report-dedupe-mapping.csv
```

Run against a **staging clone first**. The k8s job manifest is at `k8s/jobs/report-registry-dedupe.yaml` — see `k8s/jobs/README.md` for apply instructions.

### Survivor selection

When merging a group of duplicate rows:
1. **Survivor** = row with the most non-null identity fields (`sha256`, `s3Url`, `sourceUrl`, `url`). Tie-break: has `sha256` → lexicographically smallest `id`.
2. Missing fields from loser rows are null-coalesced onto the survivor.
3. If both survivor and loser have a non-null scalar that differs, survivor's value wins (a conflict row is logged when `--emit-mapping` is used).
4. If the survivor's `url` is an S3 URL but a loser has a web/link URL, the web URL is promoted to `url`.

## Key source files

| File | Purpose |
|---|---|
| `src/api/services/registryReportIdentity.ts` | Pure helpers: `buildReportLookupOr`, `pickSurvivorReport`, `mergeNullReportFields`, `isLikelyStoredObjectUrl` |
| `src/api/services/registryService.ts` | `upsertReportInRegistry` (create / update / merge), `upgradeToWebUrlIfAvailable`, `updateReportInRegistry`, `deleteReportFromRegistry` |
| `src/workers/saveToAPI.ts` | `pickRegistryPayloadFromReportingPeriodsSave` — routes pipeline job data to the correct registry fields |
| `scripts/dedupe-report-registry.ts` | One-off dedup script |
| `prisma/migrations/20260504120000_report_s3url_partial_unique/` | Adds partial unique index on `s3Url WHERE NOT NULL` |
| `tests/registryReportIdentity.test.ts` | Unit tests for identity helpers including cross-link behaviour |
| `tests/registryService.test.ts` | Unit tests for upsert logic including cross-link integration |
| `tests/saveToAPI.test.ts` | Unit tests for pipeline payload routing |
