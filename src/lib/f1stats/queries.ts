import 'server-only'

import { z } from 'zod'

import { statsGet, statsGetOrNull } from './client'
import {
  BestLapSchema,
  CircuitHistorySchema,
  CircuitSchema,
  DriverSeasonStatsSchema,
  GapSeriesSchema,
  LapChartSchema,
  LapComparisonSchema,
  OvertakeSchema,
  PitSchema,
  QualifyingPaceSchema,
  RaceControlSchema,
  SeasonPitStopsSchema,
  SessionDriverSchema,
  StandingsProgressionSchema,
  StatsConstructorSchema,
  StatsDriverSchema,
  StatsRaceSchema,
  StintPaceSchema,
  StintSchema,
  SummarySchema,
  TeammateBattleSchema,
  TimingSessionSchema,
  WeatherSchema,
  pageOf,
} from './schemas'

const MINUTE = 60
const DAY = 24 * 60 * MINUTE

/** Finished seasons barely change (a new F1DB release); the running one is re-synced every few hours. */
export function revalidateForYear(year: number, now = new Date()) {
  return year < now.getUTCFullYear() ? DAY : 15 * MINUTE
}

// ---- validation of path inputs ---------------------------------------------------------------------

function year(value: number) {
  if (!Number.isInteger(value) || value < 1950 || value > 2200) throw new RangeError(`Invalid season: ${value}`)
  return value
}

function round(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 40) throw new RangeError(`Invalid round: ${value}`)
  return value
}

/** F1DB ids are lowercase with dashes (max-verstappen, spa-francorchamps). */
export function statsId(value: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(value)) throw new RangeError(`Invalid id: ${value}`)
  return value
}

/** First season with detailed session data (OpenF1). */
export const DETAILED_FROM = 2023

/** Session slugs with detailed data (OpenF1). */
export const DETAILED_SESSIONS = [
  'race',
  'qualifying',
  'sprint',
  'sprint-qualifying',
  'free-practice-1',
  'free-practice-2',
  'free-practice-3',
] as const
export type DetailedSession = (typeof DETAILED_SESSIONS)[number]

export const isDetailedSession = (value: string | undefined): value is DetailedSession =>
  (DETAILED_SESSIONS as readonly string[]).includes(value ?? '')

// ---- F1DB ------------------------------------------------------------------------------------------

export function getStatsRace(season: number, raceRound: number) {
  return statsGetOrNull(`seasons/${year(season)}/races/${round(raceRound)}`, StatsRaceSchema, {
    revalidate: revalidateForYear(season),
  })
}

export function getSeasonStatsRaces(season: number) {
  return statsGet(`seasons/${year(season)}/races`, z.array(StatsRaceSchema), { revalidate: revalidateForYear(season) })
}

export function getSeasonDrivers(season: number) {
  return statsGet(`seasons/${year(season)}/drivers`, z.array(StatsDriverSchema), {
    revalidate: revalidateForYear(season),
  })
}

export function getSeasonConstructors(season: number) {
  return statsGet(`seasons/${year(season)}/constructors`, z.array(StatsConstructorSchema), {
    revalidate: revalidateForYear(season),
  })
}

export function getDriverStandingsProgression(season: number) {
  return statsGet(`seasons/${year(season)}/driver-standings/progression`, StandingsProgressionSchema, {
    revalidate: revalidateForYear(season),
  })
}

export function getConstructorStandingsProgression(season: number) {
  return statsGet(`seasons/${year(season)}/constructor-standings/progression`, StandingsProgressionSchema, {
    revalidate: revalidateForYear(season),
  })
}

export function getTeammateBattles(season: number) {
  return statsGet(`seasons/${year(season)}/teammates`, z.array(TeammateBattleSchema), {
    revalidate: revalidateForYear(season),
  })
}

export function getQualifyingPace(season: number) {
  return statsGet(`seasons/${year(season)}/qualifying-pace`, QualifyingPaceSchema, {
    revalidate: revalidateForYear(season),
  })
}

export function getDriverSeasonStats(season: number) {
  return statsGet(`seasons/${year(season)}/driver-stats`, z.array(DriverSeasonStatsSchema), {
    revalidate: revalidateForYear(season),
  })
}

/** Pit stop ranking of a season (2023 on); null for seasons without detailed data. */
export async function getSeasonPitStops(season: number, limit = 10) {
  const result = await statsGetOrNull(`seasons/${year(season)}/pit-stops`, SeasonPitStopsSchema, {
    revalidate: revalidateForYear(season),
    query: { limit },
  })
  return result && result.teams.length > 0 ? result : null
}

export const RECORD_SORTS = {
  wins: 'totalRaceWins',
  poles: 'totalPolePositions',
  podiums: 'totalPodiums',
  titles: 'totalChampionshipWins',
  fastestLaps: 'totalFastestLaps',
  starts: 'totalRaceStarts',
  points: 'totalPoints',
} as const
export type RecordKind = keyof typeof RECORD_SORTS

export async function getDriverRecords(kind: RecordKind, size = 10) {
  const page = await statsGet('drivers', pageOf(StatsDriverSchema), {
    revalidate: DAY,
    query: { sort: `${RECORD_SORTS[kind]},desc`, size },
  })
  return page.content
}

export async function getConstructorRecords(kind: RecordKind, size = 10) {
  const page = await statsGet('constructors', pageOf(StatsConstructorSchema), {
    revalidate: DAY,
    query: { sort: `${RECORD_SORTS[kind]},desc`, size },
  })
  return page.content
}

export function getCircuit(id: string) {
  return statsGetOrNull(`circuits/${statsId(id)}`, CircuitSchema, { revalidate: DAY })
}

export function getCircuitHistory(id: string) {
  return statsGetOrNull(`circuits/${statsId(id)}/history`, CircuitHistorySchema, { revalidate: DAY })
}

// ---- OpenF1 sessions ---------------------------------------------------------------------------------

/** Sessions of a weekend with detailed data (empty before 2023 or when not imported yet). */
export async function getTimingSessions(raceId: number, season: number) {
  return (
    (await statsGetOrNull(`races/${raceId}/timing`, z.array(TimingSessionSchema), {
      revalidate: revalidateForYear(season),
    })) ?? []
  )
}

const sessionPath = (raceId: number, session: DetailedSession, resource: string) => {
  if (!Number.isInteger(raceId) || raceId < 1) throw new RangeError(`Invalid race id: ${raceId}`)
  return `races/${raceId}/${session}/${resource}`
}

function sessionList<T extends z.ZodTypeAny>(resource: string, schema: T) {
  return (raceId: number, session: DetailedSession, season: number): Promise<z.infer<T>[] | null> =>
    statsGetOrNull(sessionPath(raceId, session, resource), z.array(schema), { revalidate: revalidateForYear(season) })
}

export const getSessionDrivers = sessionList('drivers', SessionDriverSchema)
export const getSessionSummary = sessionList('summary', SummarySchema)
export const getSessionStints = sessionList('stints', StintSchema)
export const getSessionStintPace = sessionList('stint-pace', StintPaceSchema)
export const getSessionPits = sessionList('pits', PitSchema)
export const getSessionWeather = sessionList('weather', WeatherSchema)
export const getSessionRaceControl = sessionList('race-control', RaceControlSchema)
export const getSessionOvertakes = sessionList('overtakes', OvertakeSchema)
export const getSessionLapChart = sessionList('lap-chart', LapChartSchema)
export const getSessionGaps = sessionList('gaps', GapSeriesSchema)
export const getSessionBestLaps = sessionList('best-laps', BestLapSchema)

export function getLapComparison(raceId: number, session: DetailedSession, season: number, a: string, b: string) {
  return statsGetOrNull(sessionPath(raceId, session, 'lap-comparison'), LapComparisonSchema, {
    revalidate: revalidateForYear(season),
    query: { drivers: `${statsId(a)},${statsId(b)}` },
  })
}
