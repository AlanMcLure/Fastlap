import type {
  BestLap,
  DriverSummary,
  GapSeries,
  LapChartSeries,
  Pit,
  RaceControlMessage,
  Stint,
  StintPace,
  TimingSession,
  Weather,
} from './schemas'

// Pure helpers for the race analysis page (api-f1 data). No I/O: tested with hand-built data.

// ---- formatting --------------------------------------------------------------------------------------

/** 105.706 → "1:45.706"; 45.1 → "45.100". */
export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const totalMillis = Math.round(seconds * 1000)
  const minutes = Math.floor(totalMillis / 60_000)
  const rest = ((totalMillis % 60_000) / 1000).toFixed(3)
  return minutes > 0 ? `${minutes}:${rest.padStart(6, '0')}` : rest
}

/** Gap in seconds with sign: "+0.064", "-1.200", "0.000". */
export function formatDelta(seconds: number | null | undefined, digits = 3): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const fixed = Math.abs(seconds).toFixed(digits)
  if (Number(fixed) === 0) return (0).toFixed(digits)
  return `${seconds > 0 ? '+' : '-'}${fixed}`
}

// ---- sessions ------------------------------------------------------------------------------------------

export const SESSION_LABEL: Record<string, string> = {
  race: 'Carrera',
  qualifying: 'Clasificación',
  sprint: 'Sprint',
  'sprint-qualifying': 'Clasif. sprint',
  'free-practice-1': 'Libres 1',
  'free-practice-2': 'Libres 2',
  'free-practice-3': 'Libres 3',
}

/** A race-type session (laps from a standing start, positions, pit stops) or a timed one. */
export const isRaceSession = (slug: string) => slug === 'race' || slug === 'sprint'

/** Sessions with detailed data, in weekend order, de-duplicated by slug (the first one wins). */
export function sessionTabs(sessions: TimingSession[]): { slug: string; label: string }[] {
  const seen = new Set<string>()
  return [...sessions]
    .sort((a, b) => Date.parse(a.dateStart) - Date.parse(b.dateStart))
    .filter((s) => s.slug && SESSION_LABEL[s.slug] && !seen.has(s.slug) && seen.add(s.slug))
    .map((s) => ({ slug: s.slug!, label: SESSION_LABEL[s.slug!] }))
}

// ---- tyres ---------------------------------------------------------------------------------------------

export interface TyreInfo {
  /** Letter used on Spanish broadcasts: B(lando), M(edio), D(uro), I(ntermedio), LL(uvia). */
  letter: string
  name: string
  /** 0 = lightest fill … 3 = outline only; the bars stay monochrome (direction B). */
  tone: 0 | 1 | 2 | 3
}

const TYRES: Record<string, TyreInfo> = {
  SOFT: { letter: 'B', name: 'Blando', tone: 0 },
  MEDIUM: { letter: 'M', name: 'Medio', tone: 1 },
  HARD: { letter: 'D', name: 'Duro', tone: 2 },
  INTERMEDIATE: { letter: 'I', name: 'Intermedio', tone: 3 },
  WET: { letter: 'LL', name: 'Lluvia', tone: 3 },
}

export function tyre(compound: string | null | undefined): TyreInfo {
  return (compound && TYRES[compound]) || { letter: '?', name: 'Desconocido', tone: 3 }
}

// ---- strategy ------------------------------------------------------------------------------------------

export interface StrategyRow {
  driverNumber: number
  code: string
  finishPosition: number | null
  stints: { compound: string | null; from: number; to: number; tyreAge: number }[]
}

/**
 * One row per driver in finishing order, each stint as a lap range. A stint with no end runs to the
 * driver's last lap. Stints are clipped to the race length.
 */
export function strategyRows(summary: DriverSummary[], stints: Stint[]): { rows: StrategyRow[]; laps: number } {
  const laps = Math.max(0, ...summary.map((s) => s.lapsCompleted))
  const byDriver = new Map<number, Stint[]>()
  for (const stint of stints) {
    byDriver.set(stint.driverNumber, [...(byDriver.get(stint.driverNumber) ?? []), stint])
  }
  const rows = summary.map((driver) => {
    const own = (byDriver.get(driver.driverNumber) ?? []).sort((a, b) => a.stintNumber - b.stintNumber)
    return {
      driverNumber: driver.driverNumber,
      code: driver.nameAcronym ?? String(driver.driverNumber),
      finishPosition: driver.finishPosition,
      stints: own
        .filter((s) => s.lapStart != null)
        .map((s) => ({
          compound: s.compound,
          from: s.lapStart!,
          to: Math.min(s.lapEnd ?? driver.lapsCompleted, laps || Number.MAX_SAFE_INTEGER),
          tyreAge: s.tyreAgeAtStart ?? 0,
        }))
        .filter((s) => s.to >= s.from),
    }
  })
  return { rows, laps }
}

// ---- race control --------------------------------------------------------------------------------------

export type NeutralisationKind = 'sc' | 'vsc' | 'red'

export interface Neutralisation {
  kind: NeutralisationKind
  fromLap: number
  toLap: number
}

const isScStart = (m: string) => m === 'SAFETY CAR DEPLOYED'
const isScEnd = (m: string) => m === 'SAFETY CAR IN THIS LAP'
const isVscStart = (m: string) => m === 'VIRTUAL SAFETY CAR DEPLOYED' || m === 'VSC DEPLOYED'
const isVscEnd = (m: string) => m === 'VIRTUAL SAFETY CAR ENDING' || m === 'VSC ENDING'

/**
 * Laps run behind the safety car, under a virtual safety car or stopped by a red flag, from the race
 * control messages. A period still open when the messages end lasts until `lastLap`.
 */
export function neutralisations(messages: RaceControlMessage[], lastLap: number): Neutralisation[] {
  const sorted = [...messages].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  const periods: Neutralisation[] = []
  const open: Partial<Record<NeutralisationKind, number>> = {}
  const close = (kind: NeutralisationKind, lap: number) => {
    const from = open[kind]
    if (from === undefined) return
    periods.push({ kind, fromLap: from, toLap: Math.max(from, lap) })
    delete open[kind]
  }
  for (const m of sorted) {
    const lap = m.lapNumber ?? 1
    const text = m.message.trim().toUpperCase()
    if (isScStart(text) && open.sc === undefined) open.sc = lap
    else if (isScEnd(text)) close('sc', lap)
    else if (isVscStart(text) && open.vsc === undefined) open.vsc = lap
    else if (isVscEnd(text)) close('vsc', lap)
    else if (m.flag === 'RED' && open.red === undefined) open.red = lap
    else if (m.flag === 'GREEN' && open.red !== undefined && lap > open.red) close('red', lap)
  }
  for (const kind of Object.keys(open) as NeutralisationKind[]) close(kind, lastLap)
  return periods.sort((a, b) => a.fromLap - b.fromLap)
}

export interface Penalty {
  lap: number | null
  driverNumber: number | null
  text: string
}

/** Penalties handed out by the stewards (not investigations nor "no further action"). */
export function penalties(messages: RaceControlMessage[]): Penalty[] {
  return messages
    .filter((m) => {
      const text = m.message.toUpperCase()
      return text.startsWith('FIA STEWARDS:') && /PENALTY|STOP AND GO|DRIVE THROUGH|DISQUALIFIED/.test(text) &&
        !/UNDER INVESTIGATION|NO FURTHER|NOTED|WILL BE INVESTIGATED|REVIEWED/.test(text)
    })
    .map((m) => ({
      lap: m.lapNumber,
      driverNumber: m.driverNumber,
      text: m.message.replace(/^FIA STEWARDS:\s*/i, ''),
    }))
}

// ---- weather -------------------------------------------------------------------------------------------

export interface WeatherSummary {
  air: [number, number] | null
  track: [number, number] | null
  rain: boolean
  maxWind: number | null
}

const range = (values: (number | null)[]): [number, number] | null => {
  const present = values.filter((v): v is number => v != null)
  return present.length ? [Math.min(...present), Math.max(...present)] : null
}

/** Temperature ranges and whether it rained, over the session window. */
export function weatherSummary(samples: Weather[], from?: string, to?: string | null): WeatherSummary {
  const start = from ? Date.parse(from) : -Infinity
  const end = to ? Date.parse(to) : Infinity
  const inside = samples.filter((s) => {
    const t = Date.parse(s.date)
    return t >= start && t <= end
  })
  const used = inside.length ? inside : samples
  const winds = used.map((s) => s.windSpeed).filter((v): v is number => v != null)
  return {
    air: range(used.map((s) => s.airTemperature)),
    track: range(used.map((s) => s.trackTemperature)),
    rain: used.some((s) => s.rainfall === true),
    maxWind: winds.length ? Math.max(...winds) : null,
  }
}

// ---- pace ----------------------------------------------------------------------------------------------

export interface PaceRow {
  driverNumber: number
  code: string
  team: string | null
  averageLap: number
  delta: number
}

/**
 * Race pace ranking: average of the representative laps (no lap 1, no pit laps, nothing above 107% of
 * the stint median). Drivers who completed fewer than `minLaps` laps are left out.
 */
export function paceRanking(summary: DriverSummary[], minLaps = 5): PaceRow[] {
  const rows = summary
    .filter((s) => s.averageLap != null && s.lapsCompleted >= minLaps)
    .sort((a, b) => a.averageLap! - b.averageLap!)
  const best = rows[0]?.averageLap ?? 0
  return rows.map((s) => ({
    driverNumber: s.driverNumber,
    code: s.nameAcronym ?? String(s.driverNumber),
    team: s.teamName,
    averageLap: s.averageLap!,
    delta: s.averageLap! - best,
  }))
}

/** Long runs of a practice session: stints with at least `minLaps` representative laps, best average first. */
export function longRuns(pace: StintPace[], minLaps = 5): StintPace[] {
  return pace
    .filter((s) => s.averageLap != null && s.representativeLaps >= minLaps)
    .sort((a, b) => a.averageLap! - b.averageLap!)
}

// ---- best laps -----------------------------------------------------------------------------------------

/** The fastest value of each sector in the session, to mark who set it. */
export function sessionBestSectors(rows: BestLap[]): [number | null, number | null, number | null] {
  const min = (values: (number | null)[]) => {
    const present = values.filter((v): v is number => v != null)
    return present.length ? Math.min(...present) : null
  }
  return [min(rows.map((r) => r.bestSector1)), min(rows.map((r) => r.bestSector2)), min(rows.map((r) => r.bestSector3))]
}

// ---- pit stops -----------------------------------------------------------------------------------------

/** Pit stops sorted by time stationary (when known), then by time in the pit lane. */
export function fastestPits(pits: Pit[], limit = 10): Pit[] {
  return pits
    .filter((p) => p.laneDuration != null || (p.stopDuration != null && p.stopDuration >= 1.5))
    .sort(
      (a, b) =>
        (validStop(a) ?? Infinity) - (validStop(b) ?? Infinity) ||
        (a.laneDuration ?? Infinity) - (b.laneDuration ?? Infinity)
    )
    .slice(0, limit)
}

/** OpenF1 sometimes reports impossible stationary times (0 s): anything under 1.5 s is ignored. */
const validStop = (pit: Pit) => (pit.stopDuration != null && pit.stopDuration >= 1.5 ? pit.stopDuration : null)

// ---- charts --------------------------------------------------------------------------------------------

export interface ChartDriver {
  number: number
  code: string
  team: string | null
}

/** Drivers in finishing order (unclassified last), for legends and default highlights. */
export function chartDrivers(summary: DriverSummary[]): ChartDriver[] {
  return [...summary]
    .sort((a, b) => (a.finishPosition ?? 99) - (b.finishPosition ?? 99))
    .map((s) => ({ number: s.driverNumber, code: s.nameAcronym ?? String(s.driverNumber), team: s.teamName }))
}

/** Recharts rows: one per lap, one key per driver number. */
export function lapRows<T extends { driverNumber: number }>(
  series: T[],
  points: (s: T) => { lap: number; value: number }[]
): Record<string, number>[] {
  const rows = new Map<number, Record<string, number>>()
  for (const s of series) {
    for (const p of points(s)) {
      const row = rows.get(p.lap) ?? { lap: p.lap }
      row[String(s.driverNumber)] = p.value
      rows.set(p.lap, row)
    }
  }
  return [...rows.values()].sort((a, b) => a.lap - b.lap)
}

export const gapRows = (series: GapSeries[]) =>
  lapRows(series, (s) => s.gaps.map((g) => ({ lap: g.lap, value: g.gap })))

export const positionRows = (series: LapChartSeries[]) =>
  lapRows(series, (s) => s.positions.map((p) => ({ lap: p.lap, value: p.position })))
