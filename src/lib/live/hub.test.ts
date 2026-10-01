import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LiveHub, type LiveSource } from './hub'
import type { LiveState } from './types'

const state = (seq: number, status: LiveState['status'] = 'green'): LiveState => ({
  run: 1, seq, sessionName: 't', status, lap: 1, totalLaps: 2, tower: [], messages: [],
})

const counter = (finishAt = Infinity): (() => LiveSource) => () => {
  let n = 0
  return { step: () => state(++n, n >= finishAt ? 'finished' : 'green') }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('LiveHub', () => {
  it('does not tick without listeners and sends the current state on subscribe', () => {
    const hub = new LiveHub(counter(), 1000)
    vi.advanceTimersByTime(5000)
    expect(hub.latest).toBeNull()
    const seen: number[] = []
    hub.subscribe((s) => seen.push(s.seq))
    expect(seen).toEqual([1])
    vi.advanceTimersByTime(2000)
    expect(seen).toEqual([1, 2, 3])
  })

  it('a second listener gets the latest state immediately and the source keeps one clock', () => {
    const hub = new LiveHub(counter(), 1000)
    const a: number[] = []
    const b: number[] = []
    hub.subscribe((s) => a.push(s.seq))
    vi.advanceTimersByTime(1000)
    hub.subscribe((s) => b.push(s.seq))
    expect(b).toEqual([2])
    vi.advanceTimersByTime(1000)
    expect(a).toEqual([1, 2, 3])
    expect(b).toEqual([2, 3])
  })

  it('stops ticking when the last listener leaves', () => {
    const hub = new LiveHub(counter(), 1000)
    const off = hub.subscribe(() => {})
    off()
    expect(hub.listenerCount).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('holds the final state, then restarts the source after the pause', () => {
    const hub = new LiveHub(counter(2), 1000, 5000)
    const seen: [number, string][] = []
    hub.subscribe((s) => seen.push([s.seq, s.status]))
    vi.advanceTimersByTime(1000)
    expect(seen).toEqual([[1, 'green'], [2, 'finished']])
    vi.advanceTimersByTime(3000) // still holding the final state
    expect(seen).toHaveLength(2)
    vi.advanceTimersByTime(3000) // restarted: a new source starts counting again
    expect(seen.slice(2)).toEqual([[1, 'green'], [2, 'finished']])
  })
})
