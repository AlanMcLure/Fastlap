/**
 * Own copy of historical F1 data. Queries about data that can no longer change
 * (closed seasons, races run long ago) are answered from the database when
 * present and stored after the first fetch from Jolpica. A store failure never
 * breaks a page: the live API is the fallback.
 */

/** Bump when the shape returned by `schemas.ts` changes: old rows are then ignored. */
export const SNAPSHOT_VERSION = 1

export interface SnapshotStore {
  get(key: string): Promise<unknown | null>
  put(key: string, payload: unknown): Promise<void>
}

let store: SnapshotStore | null | undefined

/** Default store, created on first use so that importing this module needs no database. */
async function defaultStore(): Promise<SnapshotStore | null> {
  if (!process.env.DATABASE_URL) return null
  const { db } = await import('@/lib/db')
  return {
    async get(key) {
      const row = await db.f1Snapshot.findUnique({ where: { key } })
      return row ? row.payload : null
    },
    async put(key, payload) {
      const json = payload as never
      await db.f1Snapshot.upsert({ where: { key }, create: { key, payload: json }, update: { payload: json } })
    },
  }
}

/** Replaces the store (tests); `null` disables snapshots. */
export function setSnapshotStore(next: SnapshotStore | null | undefined) {
  store = next
}

async function getStore() {
  if (store === undefined) {
    try {
      store = await defaultStore()
    } catch {
      store = null
    }
  }
  return store
}

export const snapshotKey = (...parts: (string | number)[]) => ['v' + SNAPSHOT_VERSION, ...parts].join(':')

/**
 * Returns the stored copy of `key`, or loads it and stores it when `isFinal`
 * says the result can no longer change.
 */
export async function withSnapshot<T>(
  key: string,
  isFinal: (value: T) => boolean,
  load: () => Promise<T>
): Promise<T> {
  const s = await getStore()
  if (s) {
    try {
      const hit = await s.get(key)
      if (hit !== null && hit !== undefined) return hit as T
    } catch {
      // fall through to the live API
    }
  }
  const value = await load()
  if (s && isFinal(value)) {
    try {
      await s.put(key, value)
    } catch {
      // not fatal: the next request tries again
    }
  }
  return value
}
