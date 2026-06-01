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

Upserts `Report` registry rows from identity fields (`reportURL`, `reportS3Url`, `reportSha256`) already stored on `ReportingPeriod`. Run this **after** the dedupe job so there are no pre-existing duplicate `Report` rows before the upsert logic runs.

1. **Run the dedupe job first** (see above).
2. Edit `backfill-report-from-periods.yaml`: set `metadata.namespace` to `garbo-stage` or `garbo`.
3. **Dry run** (recommended): change `args` to include `--dry-run`.
4. Create the job:

   ```bash
   kubectl create -f k8s/jobs/backfill-report-from-periods.yaml
   ```

5. Watch logs: `kubectl logs -n garbo-stage job/backfill-report-from-periods-<suffix> -f`
