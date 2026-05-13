# 🚀 Production Rollback PR

> **Title format:** `[Prod] Rollback to vX.X.X From vX.X.X`

> **Notes:** Garbo’s production image tag is set in `k8s/overlays/production/kustomization.yaml` under `images[].newTag`.
> The tag is normally managed by Flux via the image policy comment. For a manual rollback, temporarily remove the image policy comment, set `newTag` to the desired rollback version, and merge.

## 📦 Rollback Type

_Select the appropriate rollback type by marking with an `x`._

- [x] Roll back to previous version
- [ ] Roll back to a version other than the previous one

### Rollback Version From

_Note the relevant version rolling back from_

vX.X.X

### Rollback Version To

_Note the version to roll back to_

vX.X.X

## 📋 Reason for Rollback

_Provide a summary of the reason(s) for rollback._

-
-
-

## ✅ Checklist

- [ ] Production image tag has been updated in `k8s/overlays/production/kustomization.yaml`
- [ ] If performing a manual rollback, the Flux image policy comment was temporarily removed and will be restored after
- [ ] Any follow-up issue(s) have been created for the root cause
- [ ] Title follows the required format: `[Prod] Rollback to vX.X.X From vX.X.X`

---

_This template is for production rollbacks only. For other PR types, please select a different template._
