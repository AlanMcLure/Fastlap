import type { RaceWithResults, RaceWithSprintResults } from './schemas'

export interface ProgressionRound {
  round: number
  /** Short name for axes, e.g. "Australia". */
  label: string
  raceName: string
}

export interface ProgressionSeries {
  id: string
  /** Three-letter code for drivers (VER), the team name for constructors. */
  code: string
  name: string
  /** Accumulated points after each round, aligned with `rounds`. */
  points: number[]
}

export interface Progression {
  rounds: ProgressionRound[]
  /** Sorted by final points, highest first. */
  series: ProgressionSeries[]
}

export type ProgressionKind = 'drivers' | 'constructors'

const shortLabel = (raceName: string) => raceName.replace(/ Grand Prix$/i, '').replace(/^Gran Premio de /i, '')

/**
 * Accumulated points per round, computed from every race (and sprint) result.
 * A driver or team that scores nothing in a round keeps its previous total.
 * Points come from the results, so they can differ from the official table when
 * a penalty was applied later.
 */
export function pointsProgression(
  races: RaceWithResults[],
  sprints: RaceWithSprintResults[],
  kind: ProgressionKind
): Progression {
  const rounds = [...races].sort((a, b) => a.round - b.round)
  const sprintByRound = new Map(sprints.map((sprint) => [sprint.round, sprint.SprintResults]))

  const entries = new Map<string, { code: string; name: string; perRound: Map<number, number> }>()

  const add = (round: number, results: RaceWithResults['Results']) => {
    for (const result of results) {
      const [id, code, name] =
        kind === 'drivers'
          ? [result.Driver.driverId, result.Driver.code ?? result.Driver.familyName.slice(0, 3).toUpperCase(), `${result.Driver.givenName} ${result.Driver.familyName}`]
          : [result.Constructor.constructorId, result.Constructor.name, result.Constructor.name]
      const entry = entries.get(id) ?? { code, name, perRound: new Map<number, number>() }
      entry.perRound.set(round, (entry.perRound.get(round) ?? 0) + result.points)
      entries.set(id, entry)
    }
  }

  for (const race of rounds) {
    add(race.round, race.Results)
    add(race.round, sprintByRound.get(race.round) ?? [])
  }

  const series = [...entries.entries()].map(([id, entry]) => {
    let total = 0
    const points = rounds.map((race) => {
      total += entry.perRound.get(race.round) ?? 0
      return Math.round(total * 100) / 100
    })
    return { id, code: entry.code, name: entry.name, points }
  })

  series.sort((a, b) => b.points[b.points.length - 1] - a.points[a.points.length - 1] || a.name.localeCompare(b.name))

  return {
    rounds: rounds.map((race) => ({ round: race.round, label: shortLabel(race.raceName), raceName: race.raceName })),
    series,
  }
}
