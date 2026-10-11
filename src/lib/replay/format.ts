/**
 * Race replay: the compact format stored per race and the pure helpers that build and read it.
 * Shared by the server (building from OpenF1) and the browser (playing it back): no imports
 * with side effects here.
 *
 * Car positions are resampled to a fixed grid (`hz` frames per second from `t0`), rounded to
 * integers and delta-encoded, which keeps a two-hour race of twenty cars around 1–2 MB of JSON
 * (much less once gzipped by the server).
 */

export const REPLAY_VERSION = 2
/** Frames per second stored. The viewer interpolates between them. */
export const REPLAY_HZ = 2
/** A gap between two samples longer than this is a car that is not on track (no interpolation). */
const MAX_GAP_MS = 5000

export type ControlKind = 'sc' | 'vsc' | 'red' | 'green' | 'chequered' | 'info'
export type TrackStatus = 'green' | 'sc' | 'vsc' | 'red'

export interface ReplayDriver {
  number: number
  code: string
  name: string
  team: string
  /** `#rrggbb` */
  color: string
  /** Delta-encoded x per frame; `null` = not on track in that frame. */
  x: (number | null)[]
  y: (number | null)[]
  /** Seconds from `t0` at which each lap started (index 0 = lap 1). */
  laps: number[]
  /** Duration in seconds of each lap (index 0 = lap 1), null when unknown. */
  lapTimes: (number | null)[]
  /** [seconds from t0, gap to the leader, interval to the car ahead]: seconds, or text such as "+1 LAP". */
  gaps: [number, Gap, Gap][]
}

export type Gap = number | string | null

export interface Replay {
  v: number
  season: number
  round: number
  name: string
  /** Epoch ms of frame 0. */
  t0: number
  hz: number
  frames: number
  /** Outline of the circuit (one clean lap), absolute integer coordinates. */
  track: [number, number][]
  drivers: ReplayDriver[]
  /** [seconds from t0, driver number, position], sorted by time. */
  positions: [number, number, number][]
  /** [seconds from t0, lap number of the leader], sorted. */
  leaderLaps: [number, number][]
  /** [seconds from t0, kind, message], sorted. */
  control: [number, ControlKind, string][]
  /** [driver number, first lap, last lap, compound]. */
  stints: [number, number, number, string][]
  /** Data attribution shown with the replay (CC BY-NC-SA). */
  source: string
}

export interface Sample {
  t: number // epoch ms
  x: number
  y: number
}

/** Position of one car on the frame grid: linear interpolation between samples, `null` across gaps. */
export function resample(samples: Sample[], t0: number, frames: number, hz = REPLAY_HZ): { x: (number | null)[]; y: (number | null)[] } {
  const sorted = [...samples].sort((a, b) => a.t - b.t)
  const x: (number | null)[] = new Array(frames).fill(null)
  const y: (number | null)[] = new Array(frames).fill(null)
  let j = 0
  for (let i = 0; i < frames; i++) {
    const t = t0 + (i * 1000) / hz
    while (j < sorted.length - 2 && sorted[j + 1].t <= t) j++
    const a = sorted[j]
    const b = sorted[j + 1]
    if (a && a.t === t) {
      // a sample right on the frame needs no neighbour (it may be followed by a gap)
      x[i] = Math.round(a.x)
      y[i] = Math.round(a.y)
      continue
    }
    if (!a || !b || t < a.t || t > b.t || b.t - a.t > MAX_GAP_MS) continue
    const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
    x[i] = Math.round(a.x + (b.x - a.x) * k)
    y[i] = Math.round(a.y + (b.y - a.y) * k)
  }
  return { x, y }
}

/** Each value as the difference from the previous non-null value (the first one is absolute). */
export function encodeDeltas(values: (number | null)[]): (number | null)[] {
  let last = 0
  return values.map((v) => {
    if (v === null) return null
    const d = v - last
    last = v
    return d
  })
}

export function decodeDeltas(deltas: (number | null)[]): (number | null)[] {
  let last = 0
  return deltas.map((d) => {
    if (d === null) return null
    last += d
    return last
  })
}

/** Position of every driver at `t` (seconds from t0): the last event of each up to `t`. */
export function positionsAt(events: Replay['positions'], t: number): Map<number, number> {
  const at = new Map<number, number>()
  for (const [time, driver, pos] of events) {
    if (time > t) break
    at.set(driver, pos)
  }
  return at
}

/** Last value of a sorted [time, value] list at `t`, or `fallback` before the first. */
export function valueAt<T>(events: [number, T][], t: number, fallback: T): T {
  let value = fallback
  for (const [time, v] of events) {
    if (time > t) break
    value = v
  }
  return value
}

/** Safety car, virtual safety car, red flag or green at `t`, from the race control events. */
export function trackStatusAt(control: Replay['control'], t: number): TrackStatus {
  let status: TrackStatus = 'green'
  for (const [time, kind] of control) {
    if (time > t) break
    if (kind === 'sc' || kind === 'vsc' || kind === 'red') status = kind
    else if (kind === 'green' || kind === 'chequered') status = 'green'
  }
  return status
}

/** Lap a driver is on at `t` (0 before their first lap starts). */
export function lapOf(driver: Pick<ReplayDriver, 'laps'>, t: number): number {
  let lap = 0
  for (let i = 0; i < driver.laps.length; i++) {
    if (driver.laps[i] > t) break
    lap = i + 1
  }
  return lap
}

/** Tyre compound of a driver on a lap, from the stints. */
export function compoundOn(stints: Replay['stints'], driver: number, lap: number): string | null {
  for (const [n, first, last, compound] of stints) {
    if (n === driver && lap >= first && lap <= last) return compound
  }
  return null
}

/**
 * What a race control message means for the replay. Sector yellow flags and other noise are
 * `info` (listed but not a track status).
 */
export function classifyControl(message: string, flag: string | null | undefined): ControlKind {
  const m = message.toUpperCase()
  if (m.includes('VIRTUAL SAFETY CAR DEPLOYED')) return 'vsc'
  if (m.includes('SAFETY CAR DEPLOYED')) return 'sc'
  if (m.includes('VIRTUAL SAFETY CAR ENDING') || m.includes('SAFETY CAR IN THIS LAP')) return 'info'
  // chequered first: "CHEQUERED FLAG" contains "RED FLAG"
  if (flag === 'CHEQUERED' || /\bCHEQUERED FLAG\b/.test(m)) return 'chequered'
  if (flag === 'RED' || /\bRED FLAG\b/.test(m)) return 'red'
  // OpenF1 sends the all-clear as flag CLEAR (sometimes GREEN), message "TRACK CLEAR" (not "CLEAR IN TRACK SECTOR n")
  if (/^TRACK CLEAR\b/.test(m) || m.includes('GREEN LIGHT')) return 'green'
  return 'info'
}

/** Keeps every `step`-th point of a polyline (the circuit outline does not need 3–4 Hz). */
export function thin<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points
  const step = points.length / max
  return Array.from({ length: max }, (_, i) => points[Math.floor(i * step)])
}

/** `m:ss` or `h:mm:ss` for the replay clock. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Index of the last event at or before `t` in a list sorted by time (first element), or -1. */
export function indexAt(events: readonly (readonly [number, ...unknown[]])[], t: number): number {
  let lo = 0
  let hi = events.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (events[mid][0] <= t) {
      found = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return found
}

/** A gap as the tower shows it: "+3.4", "+1 V" for lapped cars, "" when unknown. */
export function formatGap(gap: Gap): string {
  if (gap === null || gap === undefined) return ''
  if (typeof gap === 'number') return `+${gap.toFixed(1)}`
  const laps = /^\+?(\d+)\s*LAPS?$/i.exec(gap.trim())
  return laps ? `+${laps[1]} V` : gap
}

/** A lap time: "1:16.123". */
export function lapTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return ''
  const m = Math.floor(seconds / 60)
  const rest = (seconds - m * 60).toFixed(3).padStart(6, '0')
  return m > 0 ? `${m}:${rest}` : rest
}

/** Last lap a driver has completed at `t`: its number and time (a lap is done when the next one starts). */
export function lastLap(driver: Pick<ReplayDriver, 'laps' | 'lapTimes'>, t: number): { lap: number; time: number | null } | null {
  const done = lapOf(driver, t) - 1
  if (done < 1) return null
  return { lap: done, time: driver.lapTimes[done - 1] ?? null }
}

/** Fastest lap completed by anyone up to `t`: driver number and time. */
export function fastestUntil(drivers: Pick<ReplayDriver, 'number' | 'laps' | 'lapTimes'>[], t: number): { number: number; time: number } | null {
  let best: { number: number; time: number } | null = null
  for (const d of drivers) {
    const done = lapOf(d, t) - 1
    for (let i = 0; i < done; i++) {
      const time = d.lapTimes[i]
      if (time !== null && time !== undefined && (!best || time < best.time)) best = { number: d.number, time }
    }
  }
  return best
}
