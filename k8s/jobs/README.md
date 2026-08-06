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

## Link periods to CompanyReport

Sets `ReportingPeriod.companyReportId` for all rows. One `CompanyReport` per company (latest Report). Dry-run prints `Resolution:` counts (watch `synthetic`) and a `Year mismatch:` list when the chosen PDF year ≠ max period year on that company.

1. Deploy migration `20260520120000_add_company_report` (CompanyReport table + nullable `companyReportId`).
2. Recommended: dedupe + backfill-from-periods (above).
3. Edit `link-periods-to-company-reports.yaml`: set `metadata.namespace`.
4. Dry run: add `--dry-run` to `args`; review console output before live run.
5. Create the job:

   ```bash
   kubectl create -f k8s/jobs/link-periods-to-company-reports.yaml
   ```

6. Watch logs: `kubectl logs -n garbo-stage job/link-periods-to-company-reports-<suffix> -f`

## Find duplicate companies (read-only scan)

Reports potential duplicate `Company` rows using the same normalized-name / LEI / Wikidata-conflict rules as the pipeline company-link logic. **Does not modify the database.**

1. Deploy a garbo image that includes `scripts/find-duplicate-companies.ts` (or pin `image:` in the YAML to a tag that has it).
2. Edit `find-duplicate-companies.yaml`: set `metadata.namespace` to `garbo-stage` or `garbo` (add a `namespace:` field under `metadata` before create, or `kubectl create -n <ns> -f ...`).
3. Optional: edit `args`, e.g. `--reason=wikidata_conflict`, `--limit=50`, or write `--json=/tmp/duplicate-companies.json` / `--csv=/tmp/duplicate-companies.csv`.
4. Create the job:

   ```bash
   kubectl create -n garbo-stage -f k8s/jobs/find-duplicate-companies.yaml
   ```

5. Watch logs: `kubectl logs -n garbo-stage job/find-duplicate-companies-<suffix> -f`

6. If you used `--json` or `--csv` under `/tmp`, copy files before the job TTL expires:

   ```bash
   kubectl cp -n garbo-stage <pod-name>:/tmp/duplicate-companies.csv ./duplicate-companies.csv
   ```

## Reporting periods per document (deploy order)

After the link job has run in that environment (no `companyReportId IS NULL`):

1. Deploy app + run migration `20260602120000_reporting_period_per_company_report` (`npm run migrate`).
2. **Writes:** Upsert reporting periods on `(companyReportId, year)`; `POST .../reporting-periods` accepts optional `companyReportId` and job-level report URLs.
3. **Public read:** `GET /companies` returns one period per data year (from the `CompanyReport` with the highest `reportYear`).
4. **PDF year:** Pipeline save sets `documentReportYear` on `Report` and `CompanyReport`; registry upsert updates `reportYear` when the job sends a valid year.
