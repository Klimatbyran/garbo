# Client API keys (`X-API-Key`) — developer guide

This document explains **how Garbo’s client API key layer works**, where to change things, and how to extend it safely. Use it when onboarding, debugging auth, or planning improvements.

See **Troubleshooting** below for common failures when exercising the gate locally.

---

## Mental model: two auth layers


| Layer          | Who                                               | Header                                  | Where it is enforced                                                                       |
| -------------- | ------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Client API** | Validate/Bolt proxy, browsers via proxy, partners | `**X-API-Key: garb_<lookup>.<secret>`** | `clientApiKeyGate` on routes listed in the **permission registry** (`routePermissions.ts`) |
| **Staff**      | Logged-in team (GitHub OAuth → JWT)               | `**Authorization: Bearer <jwt>`**       | `authPlugin` on routes under `**authenticatedContext**` in `src/app.ts`                    |


They are independent:

- A **client** route (e.g. `GET /api/companies`) needs a **valid key** whose role includes the mapped permission — unless anonymous bypass is on (see below).
- A **staff** route (e.g. `POST /api/companies/:id`, internal admin) needs a **JWT**. The client key gate either **does not run** (registry returns `null` for that path) or runs but is unrelated to JWT.

**Staff-only client-key admin** (list roles/keys, create key, revoke, endpoint catalog) lives under `**/api/internal/client-api-keys`** and uses **JWT only** — never `X-API-Key`.

---

## How client key auth works (request path)

1. `**clientApiKeyGate`** runs on `**onRequest**` for every request (see `src/api/plugins/clientApiKeyGate.ts`).
2. Skip if: **OPTIONS**, path does not start with **`/api/`**, path is **`/api/auth`**, path is under the **OpenAPI/Scalar doc prefix** (`/${OPENAPI_PREFIX}` — see **OpenAPI prefix must not collide with `/api`** below).
3. `**resolveClientApiPermission(method, pathname)`** — if it returns `**null**`, the gate does nothing for this request (no `X-API-Key` required at this layer). Staff-only and unlisted paths behave this way.
4. If `**ALLOW_ANONYMOUS_CLIENT_API**` is true, skip key checks entirely (cutover only; must use `**parseEnvBoolean**` in config — see `src/config/parseEnvBoolean.ts`).
5. Require `**X-API-Key**`, parse `**garb_<lookup>.<secret>**` (`src/lib/clientApiKeyCrypto.ts`).
6. Load `**ClientApiKey**` by `**keyLookup**`, `**revokedAt: null**`; verify **secret hash** with pepper `**CLIENT_API_KEY_PEPPER` ?? `API_SECRET`** (must match seed and staff key creation).
7. Check the key’s role has the **permission code** for this route; if not → **403**.
8. Optional **in-process rate limit** per key id.
9. On success, set `**request.clientApiKeyId`** / `**request.clientApiPermission**` and **fire-and-forget** update `**lastUsedAt`** on the key row.

Gate outcomes are logged with `**event: 'client_api_key_auth'**` and `**outcome**`: `missing_key`, `malformed_key`, `unknown_key`, `bad_secret`, `forbidden`, `rate_limited`, `allowed`.

---

## Permission registry (Option A)

**Source of truth for “which HTTP calls need which permission”** is:

- `**src/api/security/routePermissions.ts`** — `clientApiRouteRules` (ordered rules: first match wins; put **more specific** paths above generic prefixes) and `**CLIENT_API_PERMISSION_CODES`** (canonical permission strings).

**Rules:**

- Every **new** route on the **client API surface** (`registerClientApiRoutes` in `src/registerClientApiRoutes.ts`) must have a matching registry entry, or the `**registerClientApiRoutes.registry.test.ts`** test fails — this avoids shipping an **ungated** public route by accident.
- `**src/api/security/routePermissions.test.ts`** checks registry consistency.

The gate only consults this registry; it does not infer permissions from route handlers.

---

## Data model (Prisma)

Defined in `**prisma/schema.prisma**` (tables mapped with `@@map`):


| Model                         | Purpose                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**ClientApiPermission**`     | One row per permission **code** (e.g. `api.companies.list`).                                                                                                                            |
| `**ClientApiRole`**           | Named role (`**slug**`) e.g. `all_access`, `base`.                                                                                                                                      |
| `**ClientApiRolePermission**` | Many-to-many: which permissions a role has.                                                                                                                                             |
| `**ClientApiKey**`            | `**keyLookup**` (public id segment), `**secretHash**`, `**roleId**`, `**revokedAt**`, `**lastUsedAt**`. Full plaintext key is `**garb_<keyLookup>.<secret>**`; only the hash is stored. |


Initial migration: `prisma/migrations/20260413120000_client_api_keys/`. Later columns (e.g. `**last_used_at**`) may have their own migrations.

---

## Seed vs staff-created keys

### Seed (`prisma/seedClientApi.ts`, called from `prisma/seed.ts`)

- Upserts all `**CLIENT_API_PERMISSION_CODES**` into `**ClientApiPermission**`.
- Upserts roles `**all_access**` (all client permissions) and `**base**` (subset: companies list/read/search — see `**BASE_PERMISSION_CODES**` in `seedClientApi.ts`).
- Optionally upserts keys from env:
  - `**GARBO_ALL_ACCESS_API_KEY**`
  - `**GARBO_BASE_API_KEY**`  
  Format: `**garb_<lookup>.<secret>**`. Same pepper as runtime (`**API_SECRET**` or `**CLIENT_API_KEY_PEPPER**`).

If you change `**API_SECRET**` or the plaintext key string, run `**npx prisma db seed**` again so `**secretHash**` matches.

### Staff API (`src/api/routes/internal/clientApiKeys.admin.ts`)

Registered in `**src/app.ts**` under `**authenticatedContext**` with prefix `**api/internal/client-api-keys**`:


| Method   | Path                                             | Purpose                                                                                    |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **GET**  | `/api/internal/client-api-keys/roles`            | List roles + permission codes (for UI or ops).                                             |
| **GET**  | `/api/internal/client-api-keys`                  | List keys (metadata; no secrets).                                                          |
| **POST** | `/api/internal/client-api-keys`                  | Create key; `**apiKey`** plaintext returned **once** in JSON.                              |
| **POST** | `/api/internal/client-api-keys/:id/revoke`       | Set `**revokedAt`**; gate stops accepting the key.                                         |
| **GET**  | `/api/internal/client-api-keys/endpoint-catalog` | Export `**clientApiRouteRules`** (method/path → permission) for documentation or Validate. |


All require `**Authorization: Bearer <jwt>**`.

Validate/Bolt can call these from a staff session when you build UI — no Garbo change required beyond what is already here.

---

## Adding a new **client** HTTP surface (new permission)

Typical order:

1. **Implement the route** on the client surface in `**src/registerClientApiRoutes.ts`** (or existing module it registers).
2. Add `**'your.new.permission_code'**` to `**CLIENT_API_PERMISSION_CODES**` in `**routePermissions.ts**` (keeps codes typed and seeded).
3. Add **rule(s)** to `**clientApiRouteRules`** for the exact `**METHOD` + path pattern** (exact vs prefix — see existing rules).
4. Run `**npx prisma db seed`** so the new permission rows exist.
5. Attach that permission to roles that should use it:
  - **Built-in roles:** extend `**seedClientApi.ts`** (`CLIENT_API_PERMISSION_CODES` for `all_access`, or `**BASE_PERMISSION_CODES**` for `base`, or add a new role block).
  - **Ad-hoc:** insert `**ClientApiRolePermission`** rows (or add a future staff UI to manage role ↔ permission).
6. Confirm `**registerClientApiRoutes.registry.test.ts**` still passes.

---

## Adding a new **role** (new slug / capability bundle)

There is **no** dynamic “create role” HTTP API yet. Roles are **rows in Postgres** linked to permissions.

**Pattern:**

1. Choose a stable `**slug`** (e.g. `reports_readonly`).
2. In `**prisma/seedClientApi.ts**`, `**upsert**` the role and `**createMany**` / `**deleteMany` + create** the `**ClientApiRolePermission`** rows for the permission codes that role should have (reuse codes from `**CLIENT_API_PERMISSION_CODES**` only — unknown codes need a new client route + registry entry first, unless you only use them for future routes).
3. Run `**npx prisma db seed**`.
4. Mint keys for that role via **staff `POST /api/internal/client-api-keys`** with the new `**roleId**`, or seed a key via env if you add a third env var in seed (same pattern as `all_access`/`base`).

**Optional hardening:** add a Jest test that every role in DB has only permissions that exist in `**CLIENT_API_PERMISSION_CODES`** (not implemented today).

---

## Key format and hashing

- Plaintext: `**garb_<keyLookup>.<secretPart>**` — both segments non-empty; see `**parseClientApiKey**` in `**src/lib/clientApiKeyCrypto.ts**`.
- Stored hash: `**sha256(keyLookup + '.' + secretPart + '.' + pepper)**` as hex — see `**hashClientApiSecret**` (pepper = `**CLIENT_API_KEY_PEPPER` ?? `API_SECRET**` in `**src/config/api.ts**`).

**Never** commit plaintext keys. `**keyLookup`** appears in logs; treat `**secretPart**` like a password.

---

## Environment variables (reference)


| Variable                                | Role                                                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**API_SECRET**`                        | Required app secret; default **pepper** for hashing client key secrets.                                                                                    |
| `**CLIENT_API_KEY_PEPPER`**             | Optional override pepper (must match at seed and runtime if used).                                                                                         |
| `**ALLOW_ANONYMOUS_CLIENT_API**`        | If true, skips `X-API-Key` on gated routes — **cutover only**. Parsed with `**parseEnvBoolean`** — do **not** use raw `z.coerce.boolean()` on env strings. |
| **`GARBO_ALL_ACCESS_API_KEY`**              | Full plaintext key for the `all_access` role; seed upserts by `keyLookup`. |
| **`GARBO_BASE_API_KEY`**                    | Same for the `base` role.                                                  |
| `**OPENAPI_PREFIX**`                    | Scalar/docs mount `**/${OPENAPI_PREFIX}**`. **Must not be `api`** — see below.                                                                             |


**dotenv** does not override variables already set in the process environment; prefer unset in shell if `.env` should win.

---

## OpenAPI prefix must not collide with `/api`

The gate skips `**/${OPENAPI_PREFIX}/*`** so Scalar/OpenAPI docs do not require `X-API-Key`.

If `**OPENAPI_PREFIX=api**`, that skip matches **all** `**/api/...`** REST routes, so every client route looks “open” while `**ALLOW_ANONYMOUS_CLIENT_API**` is still false in config.

**Fix:** use a dedicated prefix (e.g. `**reference`**) — docs at `**http://localhost:3000/reference**`. `**src/config/openapi.ts**` rejects `**OPENAPI_PREFIX**` equal to `**api**` (any casing).

---

## Validate / Bolt proxy

Vite injects `**X-API-Key**` when proxying to Garbo from `**GARBO_PROXY_CLIENT_API_KEY**` (fallback `**GARBO_PROXY_PUBLIC_API_KEY**` in some setups). If the proxy env is missing, the browser hits Garbo without a key → **401** when anonymous is off.

---

## Automated tests (in repo)


| Test                                                      | Purpose                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `**src/registerClientApiRoutes.registry.test.ts`**        | Every client-route path under `/api` (except auth) has a registry permission. |
| `**src/api/security/routePermissions.test.ts**`           | Registry internal consistency.                                                |
| `**src/config/parseEnvBoolean.test.ts**`                  | Env booleans; regression for `**"false"**` string coercion bugs.              |
| `**src/api/routes/internal/clientApiKeys.admin.test.ts**` | Staff client-key admin HTTP routes.                                           |


```bash
cd garbo && npm test
```

---

## Future improvements (ideas / known limits)


| Topic                      | Notes                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Rate limit**             | In-memory `**Map`** per process — not shared across replicas; reset on restart. Move to Redis or edge if you need global limits. |
| **DB lookup per request**  | Loads key + role + permissions each time — fine for v1; could cache by `**keyLookup`** with TTL + invalidation on revoke.        |
| **Staff role management**  | No HTTP API yet to create/edit **roles** or **role ↔ permission** without seed/SQL — only keys + revoke + read catalog.          |
| **Key rotation**           | Today: revoke + create new; optional “rotate secret” endpoint could re-hash in one step.                                         |
| **Audit trail**            | Create/revoke logs include `**createdByUserId`** / `**revokedByUserId**` in app logs; no dedicated audit table yet.              |
| **All-access vs base**     | Base role scope is a **hard-coded list** (`BASE_PERMISSION_CODES`) in `**seedClientApi.ts`** — change there when base should access new client routes. |


---

## Troubleshooting


| Symptom                                                      | Likely cause                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **200** without key on `**GET /api/companies`**              | `**OPENAPI_PREFIX=api**`, anonymous on, or wrong server on port.                            |
| **401** with key, log `**bad_secret`**                       | Pepper mismatch: `**API_SECRET**` at runtime ≠ seed; or `.env` key changed without re-seed. |
| **401** with key, `**unknown_key`**                          | Wrong `**keyLookup**`, revoked key, or different `**DATABASE_URL**` than Studio.            |
| **403** with key                                             | Valid key; role lacks permission — expected for partner on non-company client routes.       |
| **500** with key, Prisma `**client_api_key` does not exist** | Migrations not applied.                                                                     |
| `**read -p`** fails in **zsh**                               | Use `**read 'Prompt? ' var`** or `**source .env**` + `**$VAR**`.                            |


---

## Quick reference: where to look


| Area                                     | Path                                                 |
| ---------------------------------------- | ---------------------------------------------------- |
| Gate                                     | `src/api/plugins/clientApiKeyGate.ts`                |
| Permission registry + HTTP rules         | `src/api/security/routePermissions.ts`               |
| Crypto                                   | `src/lib/clientApiKeyCrypto.ts`                      |
| Client route bundle                      | `src/registerClientApiRoutes.ts`                     |
| Staff key admin                          | `src/api/routes/internal/clientApiKeys.admin.ts`     |
| App wiring (gate, client vs staff trees) | `src/app.ts`                                         |
| Config / pepper / anonymous flag         | `src/config/api.ts`, `src/config/parseEnvBoolean.ts` |
| OpenAPI prefix validation                | `src/config/openapi.ts`                              |
| Seed roles + permissions + env keys      | `prisma/seedClientApi.ts`                            |
| Prisma models                            | `prisma/schema.prisma`                               |


---

## Resolved footnotes (history)

- `**ALLOW_ANONYMOUS_CLIENT_API=false` behaving like true** — fixed by `**parseEnvBoolean`** instead of unsafe `**z.coerce.boolean()**` on env strings.

