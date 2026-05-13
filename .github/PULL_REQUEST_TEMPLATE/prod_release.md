# 🚀 Production Release PR

> **Title format:** `[Prod] Major/Minor/Patch Version Bump vX.X.X`

## 📦 Release Type

_Select the appropriate release type by marking with an `x`._

- [ ] Major version bump
- [ ] Minor version bump
- [ ] Patch version bump

### Rollback Version

_Note the relevant rollback version to enable quick rollback if necessary._

vX.X.X

## 🔁 Environment Promotion

This release promotes changes **from `staging` to `production`** (see `k8s/overlays/staging` and `k8s/overlays/production`).

## 📋 What's Being Released

_Provide a summary of the features, fixes, or updates included in this production release._

-
-
-

## 🗂 Deployment Notes (optional)

_Anything to watch out for: DB migrations, feature flags, long-running jobs, cache warmup, etc._

-

## ✅ Checklist

- [ ] Version number is updated correctly (code/package and/or k8s image tag)
- [ ] All relevant changes have been QA-tested in staging
- [ ] Rollback version has been updated
- [ ] Title follows the required format: `[Prod] Major/Minor/Patch Version Bump vX.X.X`

---

_This template is for versioned production releases only. For other PR types, please select a different template._
