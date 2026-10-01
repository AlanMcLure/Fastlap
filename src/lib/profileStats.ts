import {
  DEFAULT_RULES, buildLeaderboard, outcomeKey, scorePrediction,
  type LeaderboardEntry, type LeagueRules, type Outcome, type Pick, type PredictionKind, type PredictionRow,
} from '@/lib/league'

export interface StoredPrediction {
  userId: string
  leagueId: string
  round: number
  kind: PredictionKind
  pick: Pick
  createdAt: Date
}

/** Rules of the global ranking: the defaults, the same for everybody (leagues may have their own). */
export const GLOBAL_RULES: LeagueRules = DEFAULT_RULES

/**
 * A user may predict the same race in several leagues. For the global ranking and the profile
 * only the first prediction sent for each race (and kind) counts, so predicting again in
 * another league cannot be used to hedge.
 */
export function firstPredictionPerRace(rows: StoredPrediction[]): StoredPrediction[] {
  const first = new Map<string, StoredPrediction>()
  for (const row of rows) {
    const key = `${row.userId}:${outcomeKey(row.round, row.kind)}`
    const current = first.get(key)
    if (!current || row.createdAt.getTime() < current.createdAt.getTime()) first.set(key, row)
  }
  return [...first.values()]
}

export const toRows = (rows: StoredPrediction[]): PredictionRow[] =>
  rows.map((r) => ({ userId: r.userId, round: r.round, kind: r.kind, pick: r.pick }))

export interface UserStats {
  /** Predictions sent. */
  predictions: number
  /** Predictions whose race already has an outcome. */
  scored: number
  points: number
  /** Podium places guessed exactly. */
  exact: number
  /** Predictions with the three podium places right. */
  perfect: number
  bestRace: { round: number; kind: PredictionKind; points: number } | null
  /** Latest consecutive scored predictions that earned points. */
  streak: number
  /** Points per scored prediction, one decimal. */
  average: number
}

/** Stats of one user's predictions (already one per race). Races without an outcome are not scored. */
export function computeUserStats(
  rows: StoredPrediction[],
  outcomes: ReadonlyMap<string, Outcome>,
  rules: LeagueRules = GLOBAL_RULES
): UserStats {
  const scoredRows = rows
    .map((row) => {
      const outcome = outcomes.get(outcomeKey(row.round, row.kind))
      return outcome ? { row, score: scorePrediction(row.pick, outcome, rules, row.kind) } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.row.round - b.row.round || a.row.kind.localeCompare(b.row.kind))

  let best: UserStats['bestRace'] = null
  let points = 0
  let exact = 0
  let perfect = 0
  for (const { row, score } of scoredRows) {
    points += score.total
    exact += score.exact
    if (score.exact === 3) perfect++
    if (score.total > 0 && (!best || score.total > best.points)) best = { round: row.round, kind: row.kind, points: score.total }
  }

  let streak = 0
  for (let i = scoredRows.length - 1; i >= 0 && scoredRows[i].score.total > 0; i--) streak++

  return {
    predictions: rows.length,
    scored: scoredRows.length,
    points,
    exact,
    perfect,
    bestRace: best,
    streak,
    average: scoredRows.length === 0 ? 0 : Math.round((points / scoredRows.length) * 10) / 10,
  }
}

/** Entries that share first place with at least one point (an empty or all-zero table has no champion). */
export function champions(board: LeaderboardEntry[]): LeaderboardEntry[] {
  return board.filter((e) => e.rank === 1 && e.total > 0)
}

export const leaderboardOf = (rows: StoredPrediction[], outcomes: ReadonlyMap<string, Outcome>, rules: LeagueRules = GLOBAL_RULES) =>
  buildLeaderboard(toRows(rows), outcomes, rules)
