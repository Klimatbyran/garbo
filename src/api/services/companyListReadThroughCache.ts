import { redisCache } from '@/index'
import { companyService } from './companyService'

type CompaniesList = Awaited<
  ReturnType<typeof companyService.getAllCompaniesWithMetadata>
>

/** In-flight full-list loads keyed by `companies:data:${fingerprint}`. */
const inflightLoads = new Map<string, Promise<CompaniesList>>()

/**
 * When Redis is down or empty, we still keep at most one copy of the last built
 * list in memory. The key includes the data fingerprint, so it invalidates
 * automatically when the fingerprint changes.
 */
let memoryListByKey: { key: string; data: CompaniesList } | null = null

/**
 * Resolves the full company list from Redis when possible; otherwise coalesces
 * concurrent `getAllCompaniesWithMetadata()` calls and stores the result in
 * Redis (best effort) and in memory for Redis outages.
 */
export async function getCompaniesListCached(
  databaseFingerprint: string
): Promise<CompaniesList> {
  const dataCacheKey = `companies:data:${databaseFingerprint}`

  const fromRedis = await redisCache.get(dataCacheKey)
  if (fromRedis) {
    return fromRedis as CompaniesList
  }

  if (memoryListByKey?.key === dataCacheKey) {
    return memoryListByKey.data
  }

  let load = inflightLoads.get(dataCacheKey)
  if (!load) {
    load = (async () => {
      const data = await companyService.getAllCompaniesWithMetadata()
      await redisCache.set(dataCacheKey, JSON.stringify(data))
      memoryListByKey = { key: dataCacheKey, data }
      return data
    })()
    load.finally(() => {
      inflightLoads.delete(dataCacheKey)
    })
    inflightLoads.set(dataCacheKey, load)
  }

  return load
}
