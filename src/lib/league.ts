import { sessionStart } from '@/lib/f1/calendar'
import type { Race, Result } from '@/lib/f1/schemas'

export type PredictionKind = 'RACE' | 'SPRINT'

export interface LeagueRules {
  /** Points per podium position guessed exactly. */
  exactPoints: number
  /** Points for a driver who finishes on the podium in another place. */
  presentPoints: number
  /** Points for the fastest lap of the race (races only). */
  fastestLapPoints: number
  sprintEnabled: boolean
}

export const DEFAULT_RULES: LeagueRules = { exactPoints: 5, presentPoints: 2, fastestLapPoints: 3, sprintEnabled: true }
export const MAX_RULE_POINTS = 20

export interface Pick {
  p1: string
  p2: string
  p3: string
  fastestLap?: string | null
}

export interface Outcome {
  podium: [string, string, string]
  fastestLap: string | null
}

export interface Score {
  total: number
  /** Podium places guessed exactly. */
  exact: number
  podium: number
  fastestLap: number
}

/** Podium and fastest lap of a classification; null when fewer than three drivers are classified. */
export function outcomeFromResults(results: Result[]): Outcome | null {
  const podium = [...results]
    .filter((r) => /^\d+$/.test(r.positionText))
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
    .map((r) => r.Driver.driverId)
  if (podium.length < 3) return null
  const fastest = results.find((r) => r.FastestLap?.rank === 1)
  return { podium: podium as Outcome['podium'], fastestLap: fastest?.Driver.driverId ?? null }
}

export function scorePrediction(pick: Pick, outcome: Outcome, rules: LeagueRules, kind: PredictionKind): Score {
  const guess = [pick.p1, pick.p2, pick.p3]
  let exact = 0
  let podium = 0
  guess.forEach((driver, i) => {
    if (driver === outcome.podium[i]) {
      exact++
      podium += rules.exactPoints
    } else if (outcome.podium.includes(driver as never)) {
      podium += rules.presentPoints
    }
  })
  const fastestLap =
    kind === 'RACE' && pick.fastestLap && pick.fastestLap === outcome.fastestLap ? rules.fastestLapPoints : 0
  return { total: podium + fastestLap, exact, podium, fastestLap }
}

/**
 * Last moment to predict: the start of qualifying (sprint qualifying for the sprint),
 * or of the event itself when that session is not in the calendar. Null when the
 * weekend has no sprint.
 */
export function predictionDeadline(race: Race, kind: PredictionKind): Date | null {
  if (kind === 'SPRINT') {
    const source = race.SprintQualifying ?? race.Sprint
    return source ? sessionStart(source.date, source.time).start : null
  }
  const source = race.Qualifying ?? { date: race.date, time: race.time }
  return sessionStart(source.date, source.time).start
}

/** Why a guess is not valid, or null. `drivers` are the ids that may be picked. */
export function pickProblem(pick: Pick, drivers: ReadonlySet<string>, kind: PredictionKind): string | null {
  const podium = [pick.p1, pick.p2, pick.p3]
  if (new Set(podium).size !== 3) return 'Elige tres pilotos distintos'
  if (![...podium, ...(pick.fastestLap ? [pick.fastestLap] : [])].every((id) => drivers.has(id))) {
    return 'Piloto no válido para esta temporada'
  }
  if (kind === 'SPRINT' && pick.fastestLap) return 'La vuelta rápida solo se pronostica en la carrera'
  return null
}

export interface PredictionRow {
  userId: string
  round: number
  kind: PredictionKind
  pick: Pick
}

export interface LeaderboardEntry {
  userId: string
  rank: number
  total: number
  exact: number
  /** Predictions that have been scored (their race has results). */
  scored: number
}

export const outcomeKey = (round: number, kind: PredictionKind) => `${kind}:${round}`

/**
 * Standings of a league. Only predictions whose race already has an outcome count.
 * Ties on points break on exact podium places, then share the rank ("1, 1, 3").
 */
export function buildLeaderboard(
  rows: PredictionRow[],
  outcomes: ReadonlyMap<string, Outcome>,
  rules: LeagueRules
): LeaderboardEntry[] {
  const byUser = new Map<string, Omit<LeaderboardEntry, 'rank'>>()
  for (const row of rows) {
    const entry = byUser.get(row.userId) ?? { userId: row.userId, total: 0, exact: 0, scored: 0 }
    byUser.set(row.userId, entry)
    const outcome = outcomes.get(outcomeKey(row.round, row.kind))
    if (!outcome) continue
    const score = scorePrediction(row.pick, outcome, rules, row.kind)
    entry.total += score.total
    entry.exact += score.exact
    entry.scored++
  }

  const sorted = [...byUser.values()].sort(
    (a, b) => b.total - a.total || b.exact - a.exact || a.userId.localeCompare(b.userId)
  )
  return sorted.map((entry, i) => {
    const prev = sorted[i - 1]
    const tied = prev && prev.total === entry.total && prev.exact === entry.exact
    return { ...entry, rank: tied ? 0 : i + 1 }
  }).reduce<LeaderboardEntry[]>((acc, entry) => {
    acc.push({ ...entry, rank: entry.rank || acc[acc.length - 1].rank })
    return acc
  }, [])
}
