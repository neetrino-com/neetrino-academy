// Простой in-memory кэш для API запросов
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 минут по умолчанию

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Проверяем, не истек ли TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Проверяем, не истек ли TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Очистка истекших записей
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Получение статистики кэша
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      hitRate: validEntries / this.cache.size || 0
    }
  }
}

// Создаем глобальный экземпляр кэша
export const memoryCache = new MemoryCache()

// Функция для кэширования API запросов
export async function cachedFetch<T>(
  url: string, 
  options: RequestInit = {}, 
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`
  
  // Проверяем кэш
  const cached = memoryCache.get<T>(cacheKey)
  if (cached) {
    console.log(`📦 [Cache] Hit for ${url}`)
    return cached
  }

  // Выполняем запрос
  console.log(`🌐 [API] Fetching ${url}`)
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  
  // Сохраняем в кэш
  memoryCache.set(cacheKey, data, ttl)
  
  return data
}

// Функция для инвалидации кэша по паттерну
export function invalidateCache(pattern: string): void {
  const regex = new RegExp(pattern)
  let deletedCount = 0
  
  for (const key of memoryCache['cache'].keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key)
      deletedCount++
    }
  }
  
  console.log(`🗑️ [Cache] Invalidated ${deletedCount} entries matching pattern: ${pattern}`)
}

// Автоматическая очистка каждые 10 минут
setInterval(() => {
  memoryCache.cleanup()
}, 10 * 60 * 1000)
