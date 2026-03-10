# Pipeline run and tags

## Summary

- **Pipeline API (this repo):** The "run report" entry point is **`POST /api/pipeline/run`** (auth required). It accepts optional **`tags`** (or **`companyTags`**) and passes them through to the Garbo sync step.
- **Garbo API:** Already supports tags on company create/update; the pipeline (and saveToAPI worker) call it with the tags you provide.

---

## Pipeline run endpoint

**`POST /api/pipeline/run`**

- **Auth:** Required (Bearer token).
- **Body:**
  - **`url`** (required): Report PDF URL.
  - **`tags`** (optional): `string[]` – tag option slugs to apply when the company is created or updated (e.g. `["public", "large-cap"]`).
  - **`autoApprove`** (optional): `boolean` – auto-approve extracted data (default `false`).
  - **`forceReindex`** (optional): `boolean` – re-index markdown even if already indexed (default `false`).
  - **`threadId`** (optional): Discord thread ID for notifications; omit for headless runs.

**Response (200):** `{ jobId?: string, message: string }`

Example:

```json
POST /api/pipeline/run
{ "url": "https://example.com/report.pdf", "tags": ["public", "large-cap"] }
```

---

## How tags flow to Garbo

1. **Entry points**
   - **API:** `POST /api/pipeline/run` with body `tags: string[]` → adds a **parsePdf** job with `job.data.tags`.
   - **Discord:** `/pdfs` with optional `tags` option (comma-separated slugs) → same parsePdf job data.

2. **Pipeline**
   - **parsePdf** → **precheck** → **extractEmissions** (with optional **companyTags** follow-up) → **checkDB**.
   - `job.data` (including `tags` if provided) is passed through the flow.

3. **checkDB**
   - If the company **does not exist:** creates it via **POST** `/companies/:wikidataId` with `body: { name, wikidataId, metadata, ...(tags?.length && { tags }) }`. So tags from the run request (or from AI-extracted tags if no request tags) are sent to the Garbo API on create.
   - If the company **exists** and there are tags (from request or AI): queues a **diffTags** job. **diffTags** compares existing company tags to the new tags and, if there is a diff, queues **saveToAPI** with **PATCH** `/companies/:wikidataId/tags` and `body: { tags }`.

4. **saveToAPI**
   - For `apiSubEndpoint === 'tags'` it uses **PATCH** and sends `body` (with `tags`) to the Garbo API. So the pipeline does not need to be changed on the Garbo API side; it already supports tags on create and PATCH tags.

**Precedence:** User-provided `tags` on the run request override AI-extracted tags when both exist. If the request includes `tags`, those are used for company create and for diffTags; otherwise the AI-extracted tags from the **companyTags** follow-up are used.

---

## Repo structure (where to look)

| What | Where |
|------|--------|
| Run report API | `src/api/routes/internal/pipeline.run.ts` |
| parsePdf job (receives url, tags, …) | `src/workers/parsePdf.ts` |
| checkDB (company create + queue diffTags) | `src/workers/checkDB.ts` |
| diffTags → saveToAPI | `src/workers/diffTags.ts` |
| saveToAPI (PATCH /companies/:id/tags) | `src/workers/saveToAPI.ts` |
| companyTags follow-up (AI tags) | `src/workers/followUp/companyTags.ts` |
| extractEmissions (includes companyTags child) | `src/workers/extractEmissions.ts` |
| Discord /pdfs (optional tags) | `src/discord/commands/pdfs.ts` |

---

## Tag option slugs

Tags must be valid **tag option slugs** (from **GET /api/tag-options**). Invalid slugs are rejected by the Garbo API when the pipeline calls create or PATCH tags. The FE (or Pipeline API) should only send slugs that exist in tag options.

---

## When do tag workers run?

- **Full pipeline (no runOnly):** When a report is run without a `runOnly` filter (e.g. normal `/pdfs` or `POST /api/pipeline/run`), **all** follow-up workers run, including **companyTags**. So tags are extracted by AI and then synced in checkDB/diffTags.
- **Manual / selective run:** When something (e.g. validation frontend) triggers **extractEmissions** with a **runOnly** array (e.g. to re-run only Scope 1 and Scope 2), the tag worker runs **only if** `'companyTags'` is included in that array.

So for tags to be **manually triggerable** like scope 1 or scope 2:

1. **Garbo (this repo):** No further change. The key for the tags worker is **`'companyTags'`** (see `FollowUpKey` and `FOLLOW_UP_KEYS` in `src/workers/extractEmissions.ts`).
2. **Validation frontend (or any client that triggers re-runs):** When building the `runOnly` array for an extractEmissions job, include **`'companyTags'`** when the user selects “Tags” or “Company tags” to re-run. Use the same pattern as for Scope 1 (`'scope1'`), Scope 2 (`'scope2'`), etc.

**Allowed runOnly values (for manual re-run):** `industryGics`, `scope1`, `scope2`, `scope1+2`, `scope3`, `biogenic`, `economy`, `goals`, `initiatives`, `baseYear`, **`companyTags`**, `lei`, `descriptions`. Use **`companyTags`** for the tags worker. In this repo, `src/workers/extractEmissions.ts` exports **`FOLLOW_UP_KEYS`** (array of these strings) and type **`FollowUpKey`** for use in the same codebase or by an API that returns the list.
