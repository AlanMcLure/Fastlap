import type { DriverSeason } from './queries'
import type { Race, RaceWithResults, Result } from './schemas'

/** One race of a driver: the race and his result in it. */
export interface DriverEntry {
  race: Race
  result: Result
}

/** Results grouped by driver, from a list of races. */
export function entriesByDriver(races: RaceWithResults[]): Map<string, DriverEntry[]> {
  const byDriver = new Map<string, DriverEntry[]>()
  for (const race of races) {
    for (const result of race.Results) {
      const list = byDriver.get(result.Driver.driverId) ?? []
      list.push({ race, result })
      byDriver.set(result.Driver.driverId, list)
    }
  }
  return byDriver
}

/** A career (or season) boiled down to the numbers fans look at. Race points only: sprint points are not included. */
export interface Stats {
  races: number
  wins: number
  podiums: number
  /** Races in which he started from the front of the grid. */
  polePositions: number
  fastestLaps: number
  points: number
  /** Races not finished (retired, disqualified, did not start...). */
  retirements: number
  bestFinish: number | null
  bestFinishCount: number
}

const isClassified = (result: Result) => /^\d+$/.test(result.positionText)

export function statsOf(entries: DriverEntry[]): Stats {
  const finishes = entries.filter((e) => isClassified(e.result)).map((e) => e.result.position)
  const bestFinish = finishes.length ? Math.min(...finishes) : null

  return {
    races: entries.length,
    wins: entries.filter((e) => e.result.position === 1 && isClassified(e.result)).length,
    podiums: entries.filter((e) => isClassified(e.result) && e.result.position <= 3).length,
    polePositions: entries.filter((e) => e.result.grid === 1).length,
    fastestLaps: entries.filter((e) => e.result.FastestLap?.rank === 1).length,
    points: Math.round(entries.reduce((total, e) => total + e.result.points, 0) * 100) / 100,
    retirements: entries.filter((e) => !isClassified(e.result)).length,
    bestFinish,
    bestFinishCount: bestFinish === null ? 0 : finishes.filter((p) => p === bestFinish).length,
  }
}

export interface TeamStint {
  id: string
  name: string
  firstSeason: number
  lastSeason: number
  races: number
}

/** Teams in order of first appearance, with the seasons and races spent in each. */
export function teamHistory(entries: DriverEntry[]): TeamStint[] {
  const teams = new Map<string, TeamStint>()
  const ordered = [...entries].sort((a, b) => a.race.season - b.race.season || a.race.round - b.race.round)
  for (const { race, result } of ordered) {
    const id = result.Constructor.constructorId
    const stint = teams.get(id) ?? { id, name: result.Constructor.name, firstSeason: race.season, lastSeason: race.season, races: 0 }
    stint.lastSeason = race.season
    stint.races += 1
    teams.set(id, stint)
  }
  return [...teams.values()]
}

export interface SeasonLine extends Stats {
  season: number
  teams: string[]
  /** Final championship position, when the standings are known. */
  position?: number
  positionText?: string
  /** Official points when the standings are known, otherwise the race points added up. */
  officialPoints?: number
}

/** One line per season, newest first, joining race results with the final standings. */
export function seasonLines(entries: DriverEntry[], seasons: DriverSeason[]): SeasonLine[] {
  const bySeason = new Map<number, DriverEntry[]>()
  for (const entry of entries) {
    const list = bySeason.get(entry.race.season) ?? []
    list.push(entry)
    bySeason.set(entry.race.season, list)
  }
  const standings = new Map(seasons.map((s) => [s.season, s]))

  return [...bySeason.entries()]
    .map(([season, list]) => {
      const standing = standings.get(season)
      return {
        season,
        teams: [...new Set(list.map((e) => e.result.Constructor.name))],
        ...statsOf(list),
        position: standing?.position,
        positionText: standing?.positionText,
        officialPoints: standing?.points,
      }
    })
    .sort((a, b) => b.season - a.season)
}

/**
 * Seasons in which he finished first in the championship. The running season is
 * not counted: its leader is not a champion yet.
 */
export function championshipYears(seasons: DriverSeason[], currentSeason: number): number[] {
  return seasons.filter((s) => s.position === 1 && s.season < currentSeason).map((s) => s.season)
}
