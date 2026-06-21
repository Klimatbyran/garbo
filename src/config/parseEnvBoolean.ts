/**
 * Parses typical env-style booleans for Zod `preprocess`.
 *
 * Do not use `z.coerce.boolean()` for env vars: in Zod 3 it coerces the string
 * `"false"` to `true` (non-empty string → truthy), which breaks flags like
 * `ALLOW_ANONYMOUS_CLIENT_API=false`.
 */
export function parseEnvBoolean(val: unknown): boolean {
  if (val === undefined || val === null || val === '') return false
  const s = String(val).toLowerCase().trim()
  if (['true', '1', 'yes'].includes(s)) return true
  if (['false', '0', 'no'].includes(s)) return false
  return false
}
