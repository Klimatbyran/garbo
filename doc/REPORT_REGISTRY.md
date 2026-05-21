# Report Registry

The `Report` table is a catalog of PDF documents (mainly annual and sustainability reports) that Garbo has ingested or discovered. It powers the registry tab in Validate and is the source of truth for report metadata (URL, GCS location, sha256, year).

## URL fields

A `Report` row has three URL-like columns:

| Field       | Meaning                                                                                                                                                         | Notes                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `url`       | The primary identifier for this report. Prefer the web/link URL when known; fall back to the GCS URL when the report came from a file upload with no web source. | Required, unique. Not always a web URL — a storage URL here means no web source is known. Upgraded to a web URL automatically when one arrives. |
| `sourceUrl` | The web/link URL — where the report lives publicly. Always stored when known, even if it equals `url`.                                                          | Nullable. `null` means the report was uploaded as a file with no associated web link.                                                            |
| `s3Url`     | The GCS cached copy of the PDF.                                                                                                                                  | Nullable. All newly ingested reports will have this set. Legacy rows may be `null`. Two rows cannot share the same non-null value.               |

**Rule of thumb:** `url = sourceUrl ?? s3Url`. `sourceUrl` tells you whether the report has a known public web link. `s3Url` tells you whether we have a cached copy.

## How rows are created

There are four active write paths, plus two legacy shapes still present in production data.

---

**1. Crawler** — auto-discovers report URLs from company pages; no PDF download or GCS caching.

```
{ url: "https://company.com/report-2024", sourceUrl: null, s3Url: null }
```

`sourceUrl` is `null` here because only one URL is known — it sits in `url` by convention.

---

**2. Validate registry add** — operator manually adds a report via the registry tab.

The entered URL is used as the web link. Garbo tries to cache the PDF to GCS to get the storage URL and content hash.

Result (GCS caching succeeded):

```
{ url: "https://company.com/report-2024", sourceUrl: "https://company.com/report-2024", s3Url: "https://storage.googleapis.com/garbo-reports/x.pdf", sha256: "…" }
```

Result (GCS caching failed or skipped):

```
{ url: "https://company.com/report-2024", sourceUrl: "https://company.com/report-2024", s3Url: null }
```

---

**3. Pipeline — link upload** — operator submits a web link; the pipeline fetches and caches the PDF to GCS, then saves the reporting periods.

```
{ url: "https://company.com/report-2024", sourceUrl: "https://company.com/report-2024", s3Url: "https://storage.googleapis.com/garbo-reports/x.pdf", sha256: "…" }
```

---

**4. Pipeline — file upload** — operator uploads a PDF directly; there is no web link.

Because no web URL exists, the GCS URL fills both `url` and `s3Url`.

```
{ url: "https://storage.googleapis.com/garbo-reports/x.pdf", sourceUrl: null, s3Url: "https://storage.googleapis.com/garbo-reports/x.pdf", sha256: "…" }
```

---

**Legacy rows** (pre-GCS era, no cached copy):

```
{ url: "https://company.com/report-2024", sourceUrl: null, s3Url: null }
```

**Old pipeline rows** (pre-fix: GCS URL was incorrectly placed in `url`):

```
{ url: "https://storage.googleapis.com/garbo-reports/x.pdf", sourceUrl: "https://company.com/report-2024", s3Url: null }
```

These are normalised over time when a web URL arrives and the stored URL is upgraded.

## Duplicate prevention

### How we find existing rows

When a report arrives, we search for existing rows matching any identity field: `sha256`, `sourceUrl`, `url`, or `s3Url`.

We also check two cross-links, because the crawler and pipeline historically wrote the same web URL to different columns:

- Crawler stores the web URL in `url`
- Pipeline stores it in `sourceUrl`, with the GCS URL in `url`

Without cross-linking, the pipeline would miss the existing crawler row and create a duplicate. So we also check whether an existing row's `url` matches the incoming `sourceUrl`, and vice versa.

### What happens when we find a match

- **No match** — a new row is created.
- **One match** — the existing row is updated. Fields that are already set are kept; empty fields are filled in from the new data. If the stored `url` is a GCS link but a proper web URL has now arrived, `url` is upgraded.
- **Multiple matches** — the same document was indexed more than once. The rows are merged in a transaction: the row with the most identity fields filled in is kept, its empty fields are filled from the others, and the duplicates are deleted.

## Deduplication script (one-off cleanup)

`scripts/dedupe-report-registry.ts` merges existing duplicate rows created before the upsert fix.

```bash
# Dry-run — shows what would be merged, writes nothing
npx tsx scripts/dedupe-report-registry.ts --dry-run

# Live run — merges rows, invalidates Redis cache
npx tsx scripts/dedupe-report-registry.ts

# Live run + emit a CSV mapping of which rows were merged into which
npx tsx scripts/dedupe-report-registry.ts --emit-mapping=./report-dedupe-mapping.csv
```

Run against a **staging clone first**. The k8s job manifest is at `k8s/jobs/report-registry-dedupe.yaml`.

