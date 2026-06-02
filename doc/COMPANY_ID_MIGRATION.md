# Company internal `id` migration

Adds a stable internal `Company.id` (CUID) while keeping `wikidataId` as the primary key and public identifier for now.

## Schema outcome

| Field        | Role                                      |
| ------------ | ----------------------------------------- |
| `id`         | Internal unique ID, required, `@default(cuid())` |
| `wikidataId` | Primary key (`@id`), Wikidata / API slug  |

Foreign keys (`companyId`, `companyWikidataId`, etc.) still reference `wikidataId`. No primary-key switch in this rollout.

## Migrations

| Migration | Purpose |
| --------- | ------- |
| `20260602084305_add_company_internal_id` | Add nullable `Company.id` + unique index |
| `20260602092036_require_company_internal_id` | Set `Company.id` NOT NULL |

## Backfill script

| Command | Description |
| ------- | ----------- |
| `npm run backfill:company-id:dry` | List rows that would be updated (no writes) |
| `npm run backfill:company-id` | Set `id` for every row where `id IS NULL` |

- Safe to re-run: only null `id` rows are updated.
- Uses the `cuid` package (same style as Prisma `@default(cuid())`).
- Requires `DATABASE_URL` (see `.env`).

## Per-environment rollout

Run these steps **on each database** (local, staging, production). Local data does not propagate to other environments.

### 1. Deploy application code

Ship a build that includes:

- `prisma/schema.prisma` with required `Company.id`
- Both migrations above
- `scripts/backfill-company-id.ts`

### 2. Apply migrations (first pass)

```bash
npm run migrate
# equivalent: npx prisma migrate deploy
```

**Expected on a fresh environment:**

1. Migration `add_company_internal_id` applies (nullable column).
2. Migration `require_company_internal_id` may **fail** if any `Company.id` is still `NULL`.

That failure is expected when backfill has not run yet. Migration 1 remains recorded; migration 2 stays pending.

### 3. Backfill

```bash
npm run backfill:company-id:dry   # optional check
npm run backfill:company-id
```

Confirm output:

- `null ids remaining: 0`
- `duplicate ids: 0`

### 4. Apply migrations (second pass)

```bash
npm run migrate
```

Migration `require_company_internal_id` should apply successfully.

### 5. Regenerate Prisma client (if needed)

Usually runs via `postinstall` on deploy. Locally, if `prisma generate` fails with `EPERM` on Windows, stop dev servers/workers and run:

```bash
npx prisma generate
```

## Validation (SQL)

```sql
-- Must be 0 before migration 2 can succeed
SELECT COUNT(*) FROM "Company" WHERE "id" IS NULL;

-- Must be true after backfill
SELECT COUNT(*) = COUNT(DISTINCT "id") FROM "Company";

-- Spot-check
SELECT "wikidataId", "id", "name" FROM "Company" LIMIT 10;
```

## Environments already partially migrated

| State | Action |
| ----- | ------ |
| Neither migration applied | Follow full rollout (steps 2–4) |
| Only migration 1 applied | Backfill, then `npm run migrate` |
| Both migrations applied, some null `id` | Run `npm run backfill:company-id`, then fix NOT NULL manually or re-run migrate if migration 2 is still pending |
| Both migrations applied, all rows have `id` | No DB work; optional API/schema exposure of `id` in app code |

Check status:

```bash
npx prisma migrate status
```

## Staging / production notes

- Run **backfill against that environment’s `DATABASE_URL`** (never point the script at prod from a laptop by mistake).
- Prefer staging first, validate API/workers, then production.
- `migrate deploy` does not prompt for migration names (unlike `migrate dev`); use `migrate dev` only on local dev DBs.
- If you use Kubernetes one-off jobs, mirror the pattern in `k8s/jobs/README.md`: set namespace, image tag, and run `npm run backfill:company-id` with cluster DB credentials.

## Application code (follow-up, optional)

This migration does **not** require updating every `wikidataId` reference immediately.

Add `Company.id` only where you need it:

- API response schemas (`src/api/schemas/response.ts`)
- Prisma `select` objects (`src/api/args.ts`, services)
- New internal routes or admin tools

Keep Wikidata-based routes and FKs on `wikidataId` until a future primary-key migration is planned and executed.

## Rollback

There is no automated rollback. Reverting requires a new migration and coordinated code changes. Do not drop `id` in production without a reviewed plan.

## Related files

- `prisma/schema.prisma` — `Company` model
- `prisma/migrations/20260602084305_add_company_internal_id/`
- `prisma/migrations/20260602092036_require_company_internal_id/`
- `scripts/backfill-company-id.ts`
