import type { ChartDriver } from './race'
import type { QualifyingPace, StandingsProgression, TeammateBattle } from './schemas'

// Pure helpers for the season page (api-f1 data).

export interface SeriesChart {
  /** One entry per series; `number` is only the chart key (1, 2, 3… in standings order). */
  series: ChartDriver[]
  rows: Record<string, number>[]
}

/**
 * Championship position after each round, for a bump chart. `labels` turns F1DB ids into the short code
 * shown on the chart (driver abbreviation or team name); unknown ids show the id itself.
 */
export function positionsChart(progression: StandingsProgression, labels: Map<string, string>): SeriesChart {
  const series = progression.standings.map((entry, index) => {
    const id = entry.driverId ?? entry.constructorId ?? String(index)
    return { number: index + 1, code: labels.get(id) ?? id, team: null }
  })
  const rows = progression.rounds.map((round, roundIndex) => {
    const row: Record<string, number> = { lap: round.round }
    progression.standings.forEach((entry, index) => {
      const position = entry.positionsByRound[roundIndex]
      if (position != null) row[String(index + 1)] = position
    })
    return row
  })
  return { series, rows }
}

/** Gap to the fastest team in qualifying, round by round, one series per team (best median first). */
export function qualifyingPaceChart(pace: QualifyingPace): SeriesChart {
  const series = pace.teams.map((team, index) => ({
    number: index + 1,
    code: team.constructorName ?? team.constructorId,
    team: null,
  }))
  const rows = pace.rounds.map((round, roundIndex) => {
    const row: Record<string, number> = { lap: round.round }
    pace.teams.forEach((team, index) => {
      const gap = team.gapPercentByRound[roundIndex]
      if (gap != null) row[String(index + 1)] = gap
    })
    return row
  })
  return { series, rows }
}

/** Share of the duel won by the first driver, 0–1 (0.5 when nobody won any). */
export function share(driver: number, opponent: number): number {
  return driver + opponent === 0 ? 0.5 : driver / (driver + opponent)
}

/** Teammate battles worth showing: pairs that shared at least `minRaces` races, the team's main pair first. */
export function mainBattles(battles: TeammateBattle[], minRaces = 3): TeammateBattle[] {
  return battles.filter((b) => b.races >= minRaces)
}

/** Driver labels for charts: F1DB id → abbreviation ("VER"). */
export function driverCodes(drivers: { id: string; abbreviation: string }[]): Map<string, string> {
  return new Map(drivers.map((d) => [d.id, d.abbreviation]))
}

/** "1:15.096" from milliseconds. */
export function formatMillis(millis: number): string {
  const minutes = Math.floor(millis / 60_000)
  const seconds = ((millis % 60_000) / 1000).toFixed(3).padStart(6, '0')
  return `${minutes}:${seconds}`
}
