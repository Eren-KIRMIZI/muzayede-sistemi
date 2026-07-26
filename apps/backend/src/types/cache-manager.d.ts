declare module 'cache-manager-redis-store' {
  const redisStore: any
  export = redisStore
}

declare module 'cache-manager' {
  export interface Cache {
    get<T>(key: string): Promise<T | undefined>
    set(key: string, value: unknown, ttl?: number): Promise<void>
    del(key: string): Promise<void>
    reset(): Promise<void>
    store?: { keys?: (pattern: string) => Promise<string[]> }
  }
}
