import { CACHE_CONFIG } from "./constants"

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private timers = new Map<string, NodeJS.Timeout>()

  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.defaultTTL): void {
    // Clear existing timer
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set cache item
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: Math.min(Math.max(ttl, CACHE_CONFIG.minTTL), CACHE_CONFIG.maxTTL),
    })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl * 1000)

    this.timers.set(key, timer)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    const age = (now - item.timestamp) / 1000

    if (age > item.ttl) {
      this.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): boolean {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
    return this.cache.delete(key)
  }

  clear(): void {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    const now = Date.now()
    const age = (now - item.timestamp) / 1000

    if (age > item.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Cache statistics
  getStats() {
    const items = Array.from(this.cache.values())
    const now = Date.now()

    return {
      totalItems: items.length,
      activeItems: items.filter((item) => (now - item.timestamp) / 1000 <= item.ttl).length,
      expiredItems: items.filter((item) => (now - item.timestamp) / 1000 > item.ttl).length,
      memoryUsage: JSON.stringify(items).length,
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  user: (id: number) => `user:${id}`,
  project: (id: number) => `project:${id}`,
  projects: (filters: string) => `projects:${filters}`,
  equipment: (id: number) => `equipment:${id}`,
  equipmentList: (filters: string) => `equipment:list:${filters}`,
  activity: (id: number) => `activity:${id}`,
  activities: (filters: string) => `activities:${filters}`,
  fuelRequest: (id: number) => `fuel-request:${id}`,
  fuelRequests: (filters: string) => `fuel-requests:${filters}`,
  client: (id: number) => `client:${id}`,
  clients: (filters: string) => `clients:${filters}`,
  employee: (id: number) => `employee:${id}`,
  employees: (filters: string) => `employees:${filters}`,
  dashboardStats: () => "dashboard:stats",
  userPermissions: (userId: number) => `user:${userId}:permissions`,
}

// Cache helper functions
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_CONFIG.defaultTTL,
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetchFn()
  cache.set(key, data, ttl)
  return data
}

export function invalidateCache(pattern: string): void {
  const keys = cache.keys()
  const matchingKeys = keys.filter((key) => key.includes(pattern))
  matchingKeys.forEach((key) => cache.delete(key))
}

export function invalidateCacheKeys(keys: string[]): void {
  keys.forEach((key) => cache.delete(key))
}
