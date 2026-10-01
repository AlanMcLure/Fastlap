import { driverCode, parseStopSeconds } from './format'
import type { PitStop, Result } from './schemas'

export interface RaceSummary {
  winner?: Result
  /** The driver who started first (P1 on the grid). */
  pole?: Result
  fastestLap?: Result
}

export function raceSummary(results: Result[]): RaceSummary {
  return {
    winner: results.find((r) => r.position === 1 && r.positionText === '1'),
    pole: results.find((r) => r.grid === 1),
    fastestLap: results.find((r) => r.FastestLap?.rank === 1),
  }
}

/** Places gained from the grid (positive) or lost (negative); null for pit-lane starts and retirements. */
export function placesGained(result: Result): number | null {
  if (result.grid === 0) return null
  if (!/^\d+$/.test(result.positionText)) return null
  return result.grid - result.position
}

export interface DriverPitStops {
  driverId: string
  code: string
  stops: { stop: number; lap: number; seconds: number; duration: string }[]
  fastest: number
}

/**
 * Pit stops grouped by driver, in the finishing order of the race (drivers that
 * are not in the results go last). Stops with an unreadable duration are kept
 * but never count as the fastest.
 */
export function groupPitStops(stops: PitStop[], results: Result[]): DriverPitStops[] {
  const codes = new Map(results.map((r) => [r.Driver.driverId, driverCode(r.Driver)]))
  const order = new Map(results.map((r, index) => [r.Driver.driverId, index]))
  const groups = new Map<string, DriverPitStops>()

  for (const stop of stops) {
    const seconds = parseStopSeconds(stop.duration)
    const group = groups.get(stop.driverId) ?? {
      driverId: stop.driverId,
      code: codes.get(stop.driverId) ?? stop.driverId.slice(0, 3).toUpperCase(),
      stops: [],
      fastest: Infinity,
    }
    group.stops.push({ stop: stop.stop, lap: stop.lap, seconds, duration: stop.duration })
    if (!Number.isNaN(seconds)) group.fastest = Math.min(group.fastest, seconds)
    groups.set(stop.driverId, group)
  }

  const rank = (id: string) => order.get(id) ?? Number.MAX_SAFE_INTEGER
  return [...groups.values()]
    .map((group) => ({ ...group, stops: [...group.stops].sort((a, b) => a.stop - b.stop) }))
    .sort((a, b) => rank(a.driverId) - rank(b.driverId))
}

/** The quickest stop of the race, or null when there is none. */
export function fastestPitStop(groups: DriverPitStops[]): { code: string; seconds: number } | null {
  let best: { code: string; seconds: number } | null = null
  for (const group of groups) {
    if (Number.isFinite(group.fastest) && (!best || group.fastest < best.seconds)) {
      best = { code: group.code, seconds: group.fastest }
    }
  }
  return best
}
