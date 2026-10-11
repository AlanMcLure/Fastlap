import {
  classifyControl, encodeDeltas, REPLAY_HZ, REPLAY_VERSION, resample, thin, type Gap, type Replay, type ReplayDriver, type Sample,
} from './format'

/** The OpenF1 fields the replay uses (https://openf1.org). */
export interface OF1Session {
  session_key: number
  date_start: string
  date_end: string | null
}
export interface OF1Driver {
  driver_number: number
  name_acronym: string | null
  full_name: string | null
  team_name: string | null
  team_colour: string | null
}
export interface OF1Location {
  date: string
  driver_number: number
  x: number
  y: number
}
export interface OF1Position {
  date: string
  driver_number: number
  position: number
}
export interface OF1Lap {
  driver_number: number
  lap_number: number
  date_start: string | null
  lap_duration: number | null
}
export interface OF1RaceControl {
  date: string
  category: string | null
  flag: string | null
  message: string | null
}
export interface OF1Interval {
  date: string
  driver_number: number
  gap_to_leader: Gap
  interval: Gap
}
export interface OF1Stint {
  driver_number: number
  lap_start: number | null
  lap_end: number | null
  compound: string | null
}

export interface ReplayInput {
  season: number
  round: number
  name: string
  session: OF1Session
  drivers: OF1Driver[]
  locations: Map<number, OF1Location[]>
  positions: OF1Position[]
  laps: OF1Lap[]
  control: OF1RaceControl[]
  stints: OF1Stint[]
  intervals: OF1Interval[]
}

export const REPLAY_SOURCE = 'Datos: OpenF1 (openf1.org), CC BY-NC-SA 4.0. No afiliado a la Fórmula 1.'
/** The replay runs this long after the chequered flag (the cool-down lap). */
const AFTER_FLAG_MS = 120_000
const TRACK_POINTS = 600
/** OpenF1 sends intervals every ~4 s; one every 8 s per driver is plenty for the tower. */
const GAP_EVERY_S = 8

const ms = (iso: string) => Date.parse(iso)
const secondsFrom = (t0: number, iso: string) => Math.round((ms(iso) - t0) / 100) / 10

/** OpenF1 race session of a Grand Prix: the one starting on (or a day around) the race date. */
export function pickRaceSession<T extends Pick<OF1Session, 'date_start'>>(sessions: T[], raceDate: string): T | null {
  const day = Date.parse(`${raceDate}T00:00:00Z`)
  return sessions.find((s) => Math.abs(ms(s.date_start) - day) < 2 * 86_400_000) ?? null
}

/** Start time of every lap of one driver; lap 1 often has no start, so it is derived from lap 2. */
function lapStarts(laps: OF1Lap[]): Map<number, number> {
  const starts = new Map<number, number>()
  for (const lap of laps) if (lap.date_start) starts.set(lap.lap_number, ms(lap.date_start))
  const lap1 = laps.find((l) => l.lap_number === 1)
  const lap2 = starts.get(2)
  if (!starts.has(1) && lap2 !== undefined && lap1?.lap_duration) starts.set(1, lap2 - lap1.lap_duration * 1000)
  return starts
}

/** Builds the stored replay from the raw OpenF1 responses. */
export function assembleReplay(input: ReplayInput): Replay {
  const t0 = ms(input.session.date_start)
  const chequered = input.control.find((c) => c.flag === 'CHEQUERED' && ms(c.date) > t0)
  // a loop, not Math.max(...all): a race has ~500k samples, too many arguments for one call
  let lastSample = t0
  for (const samples of input.locations.values()) for (const l of samples) lastSample = Math.max(lastSample, ms(l.date))
  const end = chequered
    ? Math.min(ms(chequered.date) + AFTER_FLAG_MS, lastSample)
    : input.session.date_end
      ? Math.min(ms(input.session.date_end), lastSample)
      : lastSample
  const frames = Math.max(1, Math.ceil(((end - t0) / 1000) * REPLAY_HZ))

  const lapsByDriver = new Map<number, OF1Lap[]>()
  for (const lap of input.laps) {
    const list = lapsByDriver.get(lap.driver_number) ?? []
    list.push(lap)
    lapsByDriver.set(lap.driver_number, list)
  }

  const gapsByDriver = new Map<number, [number, Gap, Gap][]>()
  for (const g of [...input.intervals].sort((a, b) => ms(a.date) - ms(b.date))) {
    const t = secondsFrom(t0, g.date)
    if (t < 0 || ms(g.date) > end) continue
    const list = gapsByDriver.get(g.driver_number) ?? []
    const previous = list.at(-1)
    if (!previous || t - previous[0] >= GAP_EVERY_S) list.push([t, roundGap(g.gap_to_leader), roundGap(g.interval)])
    gapsByDriver.set(g.driver_number, list)
  }

  const drivers: ReplayDriver[] = input.drivers.map((d) => {
    const samples: Sample[] = (input.locations.get(d.driver_number) ?? []).map((l) => ({ t: ms(l.date), x: l.x, y: l.y }))
    const { x, y } = resample(samples, t0, frames)
    const starts = lapStarts(lapsByDriver.get(d.driver_number) ?? [])
    const laps: number[] = []
    for (let n = 1; starts.has(n); n++) laps.push(Math.round((starts.get(n)! - t0) / 100) / 10)
    const durations = new Map((lapsByDriver.get(d.driver_number) ?? []).map((l) => [l.lap_number, l.lap_duration]))
    const lapTimes = laps.map((_, i) => durations.get(i + 1) ?? null)
    return {
      number: d.driver_number,
      code: d.name_acronym ?? String(d.driver_number),
      name: d.full_name ?? d.name_acronym ?? String(d.driver_number),
      team: d.team_name ?? '',
      color: d.team_colour ? `#${d.team_colour.replace(/^#/, '')}` : '#999999',
      x: encodeDeltas(x),
      y: encodeDeltas(y),
      laps,
      lapTimes,
      gaps: gapsByDriver.get(d.driver_number) ?? [],
    }
  })

  const leaderLaps = new Map<number, number>()
  for (const d of drivers) d.laps.forEach((t, i) => leaderLaps.set(i + 1, Math.min(leaderLaps.get(i + 1) ?? Infinity, t)))

  return {
    v: REPLAY_VERSION,
    season: input.season,
    round: input.round,
    name: input.name,
    t0,
    hz: REPLAY_HZ,
    frames,
    track: trackOutline(input, lapsByDriver),
    drivers,
    positions: input.positions
      .filter((p) => ms(p.date) <= end)
      .map((p): [number, number, number] => [Math.max(0, secondsFrom(t0, p.date)), p.driver_number, p.position])
      .sort((a, b) => a[0] - b[0]),
    leaderLaps: [...leaderLaps.entries()].map(([lap, t]): [number, number] => [t, lap]).sort((a, b) => a[0] - b[0]),
    control: input.control
      .filter((c) => c.message && ms(c.date) >= t0 && ms(c.date) <= end)
      .map((c): Replay['control'][number] => [secondsFrom(t0, c.date), classifyControl(c.message!, c.flag), c.message!])
      // sector yellows, blue flags and the like are noise in a replay; safety car notes stay
      .filter(([, kind, message]) => kind !== 'info' || /SAFETY CAR/i.test(message))
      .sort((a, b) => a[0] - b[0]),
    stints: input.stints
      .filter((s) => s.lap_start !== null && s.compound)
      .map((s): [number, number, number, string] => [s.driver_number, s.lap_start!, s.lap_end ?? 999, s.compound!]),
    source: REPLAY_SOURCE,
  }
}

const roundGap = (gap: Gap): Gap => (typeof gap === 'number' ? Math.round(gap * 1000) / 1000 : gap ?? null)

/** One clean lap of the car with most laps (lap 3, away from the start and the first pit stops). */
function trackOutline(input: ReplayInput, lapsByDriver: Map<number, OF1Lap[]>): [number, number][] {
  const [driver] = [...lapsByDriver.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? []
  const samples = (driver !== undefined ? input.locations.get(driver) : undefined) ?? [...input.locations.values()][0] ?? []
  const starts = driver !== undefined ? lapStarts(lapsByDriver.get(driver)!) : new Map<number, number>()
  const from = starts.get(3)
  const to = starts.get(4)
  const lap = from !== undefined && to !== undefined ? samples.filter((s) => ms(s.date) >= from && ms(s.date) <= to) : samples.slice(0, 400)
  return thin(lap, TRACK_POINTS).map((s): [number, number] => [Math.round(s.x), Math.round(s.y)])
}
