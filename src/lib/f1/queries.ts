import { findUpcomingRace } from './calendar'
import { f1Client } from './client'
import {
  ConstructorStandingsResponseSchema,
  DriverStandingsResponseSchema,
  DriversResponseSchema,
  PitStopsResponseSchema,
  RacesResponseSchema,
  ResultsResponseSchema,
  SprintResultsResponseSchema,
  type ConstructorStanding,
  type Driver,
  type DriverStanding,
  type PitStop,
  type Race,
  type RaceWithResults,
  type RaceWithSprintResults,
} from './schemas'
import { snapshotKey, withSnapshot } from './snapshots'

export type Season = number | 'current'

const HOUR = 60 * 60
const DAY = 24 * HOUR

export interface Standings<T> {
  season: number
  round: number
  standings: T[]
}

// ---- input validation: values end up inside the request path ----------------

function seasonSegment(season: Season) {
  if (season === 'current') return 'current'
  if (!Number.isInteger(season) || season < 1950 || season > 2200) {
    throw new RangeError(`Invalid season: ${season}`)
  }
  return String(season)
}

function roundSegment(round: number) {
  if (!Number.isInteger(round) || round < 1 || round > 40) {
    throw new RangeError(`Invalid round: ${round}`)
  }
  return String(round)
}

function idSegment(id: string) {
  if (!/^[a-z0-9_]{1,60}$/.test(id)) throw new RangeError(`Invalid id: ${id}`)
  return id
}

/** Finished seasons never change; the running one is refreshed every hour. */
export function revalidateFor(season: Season, now = new Date()) {
  return season !== 'current' && season < now.getUTCFullYear() ? 7 * DAY : HOUR
}

/** True for a season that is over: its data never changes any more. */
export function isClosedSeason(season: Season, now = new Date()): season is number {
  return season !== 'current' && season < now.getUTCFullYear()
}

/** Reads through the own copy: stored only once the data is final (see snapshots.ts). */
function snapshot<T>(parts: (string | number)[], isFinal: (value: T) => boolean, load: () => Promise<T>) {
  return withSnapshot(snapshotKey(...parts), isFinal, load)
}

const closedAndFilled = (season: Season) => (value: unknown[]) => isClosedSeason(season) && value.length > 0

/** A race run more than 3 days ago has its final classification (penalties are applied by then). */
function raceIsSettled(race: Race, now = new Date()) {
  return isClosedSeason(race.season, now) || now.getTime() - Date.parse(`${race.date}T00:00:00Z`) > 3 * DAY * 1000
}

/** Joins the pieces of a race that a page boundary split, keeping rounds in order. */
export function mergeRaces<K extends 'Results' | 'SprintResults', R extends Race & Record<K, unknown[]>>(
  races: R[],
  key: K
): R[] {
  const byRound = new Map<number, R>()
  for (const race of races) {
    const existing = byRound.get(race.round)
    if (existing) {
      byRound.set(race.round, { ...existing, [key]: [...existing[key], ...race[key]] })
    } else {
      byRound.set(race.round, race)
    }
  }
  return [...byRound.values()].sort((a, b) => a.round - b.round)
}

// ---- queries ----------------------------------------------------------------

export async function getCalendar(season: Season = 'current'): Promise<Race[]> {
  return snapshot(['calendar', seasonSegment(season)], closedAndFilled(season), () =>
    f1Client.getAll(`${seasonSegment(season)}.json`, RacesResponseSchema, (page) => page.MRData.RaceTable.Races, {
      revalidate: revalidateFor(season),
    })
  )
}

/**
 * The next race to be run (the one in progress counts). When the current season
 * is over it looks at the following season's calendar, once it is published.
 */
export async function getNextRace(now = new Date()): Promise<Race | null> {
  const races = await getCalendar('current')
  const next = findUpcomingRace(races, now)
  if (next || races.length === 0) return next

  const following = await getCalendar(races[0].season + 1)
  return findUpcomingRace(following, now)
}

export async function getDriverStandings(
  season: Season = 'current',
  round?: number
): Promise<Standings<DriverStanding> | null> {
  const path = [seasonSegment(season), round && roundSegment(round), 'driverStandings.json']
    .filter(Boolean)
    .join('/')
  return snapshot(['driverStandings', seasonSegment(season), round ?? 'last'], (value: Standings<DriverStanding> | null) => value !== null && isClosedSeason(season), async () => {
    const data = await f1Client.get(path, DriverStandingsResponseSchema, {
      revalidate: revalidateFor(season),
      query: { limit: 100 },
    })
    const list = data.MRData.StandingsTable.StandingsLists[0]
    return list ? { season: list.season, round: list.round, standings: list.DriverStandings } : null
  })
}

export async function getConstructorStandings(
  season: Season = 'current',
  round?: number
): Promise<Standings<ConstructorStanding> | null> {
  const path = [seasonSegment(season), round && roundSegment(round), 'constructorStandings.json']
    .filter(Boolean)
    .join('/')
  return snapshot(['constructorStandings', seasonSegment(season), round ?? 'last'], (value: Standings<ConstructorStanding> | null) => value !== null && isClosedSeason(season), async () => {
    const data = await f1Client.get(path, ConstructorStandingsResponseSchema, {
      revalidate: revalidateFor(season),
      query: { limit: 100 },
    })
    const list = data.MRData.StandingsTable.StandingsLists[0]
    return list ? { season: list.season, round: list.round, standings: list.ConstructorStandings } : null
  })
}

/** Results of one race, or null when it has not been run (or does not exist). */
export async function getRaceResults(season: Season, round: number): Promise<RaceWithResults | null> {
  return snapshot(
    ['results', seasonSegment(season), roundSegment(round)],
    (race: RaceWithResults | null) => race !== null && raceIsSettled(race),
    async () => {
      const data = await f1Client.get(
        `${seasonSegment(season)}/${roundSegment(round)}/results.json`,
        ResultsResponseSchema,
        { revalidate: revalidateFor(season), query: { limit: 100 } }
      )
      return data.MRData.RaceTable.Races[0] ?? null
    }
  )
}

/**
 * Every race result of a season. Results are read 100 per page, so one race can
 * arrive split across two pages: the pieces are merged by round.
 */
export async function getSeasonResults(season: Season): Promise<RaceWithResults[]> {
  return snapshot(['season-results', seasonSegment(season)], closedAndFilled(season), async () => {
    const pages = await f1Client.getAll(
      `${seasonSegment(season)}/results.json`,
      ResultsResponseSchema,
      (page) => page.MRData.RaceTable.Races,
      { revalidate: revalidateFor(season) }
    )
    return mergeRaces(pages, 'Results')
  })
}

/** Sprint results of a season (empty before 2021). */
export async function getSeasonSprintResults(season: Season): Promise<RaceWithSprintResults[]> {
  return snapshot(['season-sprint', seasonSegment(season)], (v: RaceWithSprintResults[]) => isClosedSeason(season) && v.length > 0, async () => {
    const pages = await f1Client.getAll(
      `${seasonSegment(season)}/sprint.json`,
      SprintResultsResponseSchema,
      (page) => page.MRData.RaceTable.Races,
      { revalidate: revalidateFor(season) }
    )
    return mergeRaces(pages, 'SprintResults')
  })
}

export async function getPitStops(season: Season, round: number): Promise<PitStop[]> {
  return snapshot(['pitstops', seasonSegment(season), roundSegment(round)], closedAndFilled(season), () =>
    f1Client.getAll(
      `${seasonSegment(season)}/${roundSegment(round)}/pitstops.json`,
      PitStopsResponseSchema,
      (page) => page.MRData.RaceTable.Races.flatMap((race) => race.PitStops),
      { revalidate: revalidateFor(season) }
    )
  )
}

export async function getDrivers(season?: Season): Promise<Driver[]> {
  const path = season === undefined ? 'drivers.json' : `${seasonSegment(season)}/drivers.json`
  const load = () =>
    f1Client.getAll(path, DriversResponseSchema, (page) => page.MRData.DriverTable.Drivers, {
      revalidate: season === undefined ? DAY : revalidateFor(season),
    })
  return season === undefined ? load() : snapshot(['drivers', seasonSegment(season)], closedAndFilled(season), load)
}

export async function getDriver(driverId: string): Promise<Driver | null> {
  const data = await f1Client.get(`drivers/${idSegment(driverId)}.json`, DriversResponseSchema, {
    revalidate: DAY,
  })
  return data.MRData.DriverTable.Drivers[0] ?? null
}

export interface DriverSeason {
  season: number
  /** Last round of the standings (the season's final one for closed seasons). */
  round: number
  position?: number
  positionText: string
  points: number
  wins: number
  teams: string[]
}

/** A driver's final championship position in every season he took part in, oldest first. */
export async function getDriverSeasons(driverId: string): Promise<DriverSeason[]> {
  const lists = await f1Client.getAll(
    `drivers/${idSegment(driverId)}/driverStandings.json`,
    DriverStandingsResponseSchema,
    (page) => page.MRData.StandingsTable.StandingsLists,
    { revalidate: DAY }
  )
  return lists
    .flatMap((list) =>
      list.DriverStandings.map((s) => ({
        season: list.season,
        round: list.round,
        position: s.position,
        positionText: s.positionText,
        points: s.points,
        wins: s.wins,
        teams: s.Constructors.map((c) => c.name),
      }))
    )
    .sort((a, b) => a.season - b.season)
}

/** Every race result of a driver's career, oldest first. */
export async function getDriverResults(driverId: string): Promise<RaceWithResults[]> {
  return f1Client.getAll(
    `drivers/${idSegment(driverId)}/results.json`,
    ResultsResponseSchema,
    (page) => page.MRData.RaceTable.Races,
    { revalidate: DAY }
  )
}

