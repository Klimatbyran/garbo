# Company internal `id` migration

Adds a stable internal `Company.id` (UUID) while keeping `wikidataId` as the primary key and public identifier for now.

## Schema outcome

| Field        | Role                                              |
| ------------ | ------------------------------------------------- |
| `id`         | Internal unique ID, required, `@default(uuid())`  |
| `wikidataId` | Primary key (`@id`), Wikidata / API slug          |

Foreign keys (`companyId`, `companyWikidataId`, etc.) still reference `wikidataId`. No primary-key switch in this rollout.

## Migration

Single migration: `20260602120000_add_company_internal_id`

1. Adds nullable `Company.id`
2. Backfills existing rows with `gen_random_uuid()::text` in SQL
3. Sets `id` NOT NULL
4. Creates unique index on `id`

No separate backfill script or Kubernetes job.

## Per-environment rollout

Run on each database (local, staging, production).

### 1. Deploy application code

Ship a build that includes:

- `prisma/schema.prisma` with required `Company.id` (`@default(uuid())`)
- Migration `20260602120000_add_company_internal_id`
- API schemas using `companyIdSchema` (`z.string().uuid()`)

### 2. Apply migrations

```bash
npm run migrate
# equivalent: npx prisma migrate deploy
```

One `migrate deploy` is enough; backfill runs inside the migration.

### 3. Regenerate Prisma client (if needed)

Usually via `postinstall` on deploy. Locally, if `prisma generate` fails on Windows, stop dev servers and run:

```bash
npx prisma generate
```

## Validation (SQL)

```sql
SELECT COUNT(*) FROM "Company" WHERE "id" IS NULL;  -- must be 0

SELECT COUNT(*) = COUNT(DISTINCT "id") FROM "Company";

SELECT "wikidataId", "id", "name" FROM "Company" LIMIT 10;
```

## Local dev: replaced earlier CUID migrations

If you already applied the old two-step migrations (`20260602084305_*`, `20260602092036_*`) or ran the CUID backfill script, reset before applying the new migration:

```bash
# Option A: full local reset (destructive)
npm run reset

# Option B: manual (keeps other data)
# Drop column and clear old migration records, then migrate deploy:
#   ALTER TABLE "Company" DROP COLUMN IF EXISTS "id";
#   DELETE FROM "_prisma_migrations"
#     WHERE migration_name IN (
#       '20260602084305_add_company_internal_id',
#       '20260602092036_require_company_internal_id'
#     );
npm run migrate
```

Staging/production that never received the old migrations only need `migrate deploy`.

## Staging / production notes

- Garbo owns `migrate deploy` on the shared database; API and validate-frontend deploy after.
- Run staging first, smoke-test API, then production.

## Application code

Expose `Company.id` where needed (response schemas, selects). Keep routes and FKs on `wikidataId` until a future primary-key change.

## Rollback

No automated rollback. Reverting requires a new migration and coordinated code changes.

## Related files

- `prisma/schema.prisma` — `Company` model
- `prisma/migrations/20260602120000_add_company_internal_id/`
- `src/api/schemas/common.ts` — `companyIdSchema`
