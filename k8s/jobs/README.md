# One-off Kubernetes jobs

These manifests are **not** wired into `k8s/base/kustomization.yaml` (Flux). Apply them manually when you need to run maintenance against the in-cluster Postgres/Redis without port-forwarding.

## Report registry dedupe

1. Edit `report-registry-dedupe.yaml`: set `metadata.namespace` to `garbo-stage` or `garbo`. Pin an image tag in the YAML if you need the job to run against one exact image.
2. Create the job (unique name each run — uses `generateName`):

   ```bash
   kubectl create -f k8s/jobs/report-registry-dedupe.yaml
   ```

3. Watch logs in Lens or: `kubectl logs -n garbo-stage job/report-registry-dedupe-<suffix> -f`

4. After completion, delete the job if you want a clean namespace: `kubectl delete job -n <ns> <job-name>`

**Note:** The production image omits devDependencies, so the job runs the script via `npx --yes tsx`, which may download `tsx` on first start (needs egress to the npm registry).

## Report backfill from periods

Upserts `Report` registry rows from identity fields (`reportURL`, `reportS3Url`, `reportSha256`) already stored on `ReportingPeriod`. Clusters periods by shared identity, merges web-only and GCS-only clusters when the PDF file name matches (same company), and sets `reportYear` from the URL path when possible.

1. **Run the dedupe job first** (see above).
2. Edit `backfill-report-from-periods.yaml`: set `metadata.namespace` to `garbo-stage` or `garbo`.
3. **Dry run** (recommended): change `args` to include `--dry-run`.
4. Create the job:

   ```bash
   kubectl create -f k8s/jobs/backfill-report-from-periods.yaml
   ```

5. Watch logs: `kubectl logs -n garbo-stage job/backfill-report-from-periods-<suffix> -f`

## Link periods to CompanyReport (PR 1)

Sets `ReportingPeriod.companyReportId` for all rows. One `CompanyReport` per company (latest Report). Dry-run prints `Resolution:` counts (watch `synthetic`) and a `Year mismatch:` list when the chosen PDF year ≠ max period year on that company.

1. Deploy PR 1 schema (migration).
2. Recommended: dedupe + backfill-from-periods (above).
3. Edit `link-periods-to-company-reports.yaml`: set `metadata.namespace`.
4. Dry run: add `--dry-run` to `args`; review console output before live run.
5. Create the job:

   ```bash
   kubectl create -f k8s/jobs/link-periods-to-company-reports.yaml
   ```

6. Watch logs: `kubectl logs -n garbo-stage job/link-periods-to-company-reports-<suffix> -f`

## PR 2 schema (per-report period uniqueness)

Deploy order after PR 1 link job has run in that environment (no `companyReportId IS NULL`):

1. Deploy app + run migration `20260602120000_reporting_period_per_company_report` (`npm run migrate`).
2. Writes upsert on `(companyReportId, year)` instead of `(companyId, year)`; same calendar year can exist under two `CompanyReport` rows after PR 1b.
3. `POST .../reporting-periods` accepts optional `companyReportId` (body or per period); otherwise resolves shell from report URLs/hash or the company’s default `CompanyReport`.
