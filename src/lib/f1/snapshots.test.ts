import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture } from './fixtures'
import { getCalendar, getRaceResults, isClosedSeason } from './queries'
import { setSnapshotStore, snapshotKey, withSnapshot, type SnapshotStore } from './snapshots'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function memoryStore() {
  const rows = new Map<string, unknown>()
  const store: SnapshotStore = {
    get: async (key) => rows.get(key) ?? null,
    put: async (key, payload) => void rows.set(key, JSON.parse(JSON.stringify(payload))),
  }
  return { rows, store }
}

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  setSnapshotStore(null)
})

describe('withSnapshot', () => {
  it('loads once and serves the stored copy afterwards', async () => {
    const { store, rows } = memoryStore()
    setSnapshotStore(store)
    const load = vi.fn(async () => ({ a: 1 }))
    expect(await withSnapshot('k', () => true, load)).toEqual({ a: 1 })
    expect(await withSnapshot('k', () => true, load)).toEqual({ a: 1 })
    expect(load).toHaveBeenCalledTimes(1)
    expect(rows.has('k')).toBe(true)
  })

  it('does not store a value that is not final', async () => {
    const { store, rows } = memoryStore()
    setSnapshotStore(store)
    await withSnapshot('k', () => false, async () => 1)
    expect(rows.size).toBe(0)
  })

  it('falls back to the live data when the store fails', async () => {
    setSnapshotStore({
      get: async () => {
        throw new Error('db down')
      },
      put: async () => {
        throw new Error('db down')
      },
    })
    expect(await withSnapshot('k', () => true, async () => 7)).toBe(7)
  })

  it('keys carry the schema version', () => {
    expect(snapshotKey('calendar', 2024)).toBe('v1:calendar:2024')
  })
})

describe('queries with an own copy', () => {
  it('isClosedSeason', () => {
    const now = new Date('2026-06-01T00:00:00Z')
    expect(isClosedSeason(2025, now)).toBe(true)
    expect(isClosedSeason(2026, now)).toBe(false)
    expect(isClosedSeason('current', now)).toBe(false)
  })

  it('a closed season calendar is fetched once and then read from the store', async () => {
    const { store, rows } = memoryStore()
    setSnapshotStore(store)
    fetchMock.mockImplementation(async () => ok(fixture('calendar')))
    const first = await getCalendar(2024)
    const second = await getCalendar(2024)
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect([...rows.keys()]).toEqual(['v1:calendar:2024'])
  })

  it('the running season is never stored', async () => {
    const { store, rows } = memoryStore()
    setSnapshotStore(store)
    fetchMock.mockImplementation(async () => ok(fixture('calendar')))
    await getCalendar('current')
    expect(rows.size).toBe(0)
  })

  it('a race that has not been run is not stored', async () => {
    const { store, rows } = memoryStore()
    setSnapshotStore(store)
    fetchMock.mockImplementation(async () => ok({ MRData: { total: '0', RaceTable: { Races: [] } } }))
    expect(await getRaceResults(2024, 3)).toBeNull()
    expect(rows.size).toBe(0)
  })
})
