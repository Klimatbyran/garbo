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

## Restore validated Scope1 data from recovered DB

Copies human-verified Scope1 values from the recovered database into the target (prod) database,
adapting to the `CompanyReport`-based `ReportingPeriod` structure.
Each value is anchored to the specific PDF it came from (`reportURL`) — periods from different
reports are never mixed even if they cover the same company and year.
Defaults to dry-run. Pass `--commit` to write.

---

### Option A — Run locally (recommended first)

Prerequisites:

- Recovered dump at `~/Downloads/recovered.dump`
- Local postgres running on port 5432 as target (seeded from prod dump — see step below)
- Recovered postgres running on port 5433

**Seed local target postgres from a prod dump:**

```bash
# Set PGPASSWORD to your local postgres password first
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE garbo;" || true
pg_restore -h localhost -p 5432 -U postgres -d garbo \
  --no-owner --no-acl --clean --if-exists ~/Downloads/proddump.dump
```

**Start a local recovered postgres on port 5433:**

```bash
docker run --rm -e POSTGRES_HOST_AUTH_METHOD=trust -p 5433:5432 -d --name recovered-pg postgres:16
docker cp ~/Downloads/recovered.dump recovered-pg:/recovered.dump
docker exec -it recovered-pg createdb -U postgres recovered
docker exec -it recovered-pg pg_restore -U postgres -d recovered \
  --no-owner --no-acl --clean --if-exists /recovered.dump
```

**Run the script:**

```bash
# Dry run (default):
SOURCE_DATABASE_URL=postgresql://postgres@localhost:5433/recovered \
DATABASE_URL=postgresql://postgres:<your-local-password>@localhost:5432/garbo \
npx tsx scripts/restore-validated-scope1.ts

# Commit for real:
SOURCE_DATABASE_URL=postgresql://postgres@localhost:5433/recovered \
DATABASE_URL=postgresql://postgres:<your-local-password>@localhost:5432/garbo \
npx tsx scripts/restore-validated-scope1.ts --commit
```

---

### Option B — Run in-cluster (against live prod)

Test on `garbo-stage` first before running against `garbo`.

**Step 1 — Upload the recovered dump to GCS:**

```bash
gsutil cp ~/Downloads/recovered.dump gs://<BACKUP_BUCKET>/manual/recovered.dump
```

**Step 2 — Edit `recovered-postgres.yaml`:** Replace `<BACKUP_BUCKET>` with the actual bucket name.

**Step 3 — Start the temporary recovered-postgres pod:**

```bash
kubectl apply -f k8s/jobs/recovered-postgres.yaml -n garbo
kubectl get pods -n garbo -l app=recovered-postgres -w   # wait until Running
```

**Step 4 — Dry run:**

```bash
kubectl apply -f k8s/jobs/restore-validated-scope1.yaml -n garbo
kubectl logs -n garbo job/restore-validated-scope1 -f
```

**Step 5 — Commit (edit YAML first):** Uncomment the `--commit` line in `args`, then:

```bash
kubectl delete job restore-validated-scope1 -n garbo
kubectl apply -f k8s/jobs/restore-validated-scope1.yaml -n garbo
kubectl logs -n garbo job/restore-validated-scope1 -f
```

**Step 6 — Tear down recovered-postgres when done:**

```bash
kubectl delete -f k8s/jobs/recovered-postgres.yaml -n garbo
```

---

### Things to consider before running

- **GCS auth:** The `recovered-postgres` init container uses `gsutil` but has no service account configured. The cluster node needs Workload Identity or default GCS credentials for the download to work.
- **Script must be deployed:** The job image pulls `ghcr.io/klimatbyran/garbo:latest`. The script must be merged and a new image built before running in-cluster.
- **`reportYear` on CompanyReport:** Set to the emissions year (`2024`) since the PDF publication year isn't available in the recovered DB. May differ from the actual report year.

---

## Reporting periods per document (deploy order)

After the link job has run in that environment (no `companyReportId IS NULL`):

1. Deploy app + run migration `20260602120000_reporting_period_per_company_report` (`npm run migrate`).
2. **Writes:** Upsert reporting periods on `(companyReportId, year)`; `POST .../reporting-periods` accepts optional `companyReportId` and job-level report URLs.
3. **Public read:** `GET /companies` returns one period per data year (from the `CompanyReport` with the highest `reportYear`).
4. **PDF year:** Pipeline save sets `documentReportYear` on `Report` and `CompanyReport`; registry upsert updates `reportYear` when the job sends a valid year.
