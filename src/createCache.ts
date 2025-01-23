export function createServerCache({ maxAge }: { maxAge: number }) {
  const cache = new Map<string, { data: any; cachedAt: number }>()

  return {
    set(key: string, value: any) {
      cache.set(key, { data: value, cachedAt: Date.now() })
    },
    get(key: string) {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.cachedAt < maxAge) {
        return cached.data
      }
      cache.delete(key)
      return null
    },
    has(key: string) {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.cachedAt < maxAge) {
        return true
      }
      cache.delete(key)
      return false
    },
    delete(key: string) {
      cache.delete(key)
    },
    clear() {
      cache.clear()
    },
  }
}
