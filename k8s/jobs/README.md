# One-off Kubernetes jobs

These manifests are **not** wired into `k8s/base/kustomization.yaml` (Flux). Apply them manually when you need to run maintenance against the in-cluster Postgres/Redis without port-forwarding.

## Report registry dedupe

Merges duplicate `Report` rows and clears the registry Redis cache. Uses the same image and DB/Redis wiring as the Garbo API/worker.

1. Edit `report-registry-dedupe.yaml`: set `metadata.namespace` to `garbo-stage` or `garbo`. The image matches `backfill-report-runs.yaml` (unpinned `ghcr.io/klimatbyran/garbo` + `Always` pull). Pin a tag in the YAML only if you need that Job to run against one exact image.
2. **Dry run** (recommended first): change the container `args` to include `--dry-run` (see comments in the YAML).
3. Create the job (unique name each run — uses `generateName`):

   ```bash
   kubectl create -f k8s/jobs/report-registry-dedupe.yaml
   ```

4. Watch logs in Lens or: `kubectl logs -n garbo-stage job/report-registry-dedupe-<suffix> -f`

5. After completion, delete the job if you want a clean namespace: `kubectl delete job -n <ns> <job-name>`

**Note:** The production image omits devDependencies, so the job runs the script via `npx --yes tsx`, which may download `tsx` on first start (needs egress to the npm registry).
