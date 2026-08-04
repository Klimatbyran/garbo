import { createHash } from 'crypto'

import { prisma } from './prisma'

/** Stable bigint key for Postgres advisory locks from a normalized company name. */
export function advisoryLockKeyForNormalizedName(
  normalizedName: string
): bigint {
  const hash = createHash('sha256').update(normalizedName).digest()
  return hash.readBigInt64BE(0)
}

type AdvisoryLockOptions = {
  /** Prisma interactive transaction timeout (ms). Create path may include HTTP calls. */
  timeoutMs?: number
}

/**
 * Runs fn while holding a transaction-scoped advisory lock for the normalized name.
 * Prevents concurrent pipeline runs from creating duplicate name-only companies.
 */
export async function withNormalizedCompanyNameLock<T>(
  normalizedName: string,
  fn: () => Promise<T>,
  options: AdvisoryLockOptions = {}
): Promise<T> {
  const key = advisoryLockKeyForNormalizedName(
    normalizedName.length > 0 ? normalizedName : 'unknown'
  )
  const timeoutMs = options.timeoutMs ?? 120_000
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key})`
      return fn()
    },
    { timeout: timeoutMs }
  )
}
