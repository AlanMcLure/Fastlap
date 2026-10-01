import 'server-only'

import { db } from '@/lib/db'
import { isClosedSeason } from '@/lib/f1/queries'
import type { LeagueRules } from '@/lib/league'
import { loadOutcomes } from '@/lib/leagueData'
import {
  GLOBAL_RULES, champions, computeUserStats, firstPredictionPerRace, leaderboardOf, type StoredPrediction, type UserStats,
} from '@/lib/profileStats'

type DbPrediction = {
  userId: string; leagueId: string; round: number; kind: 'RACE' | 'SPRINT'
  p1: string; p2: string; p3: string; fastestLap: string | null; createdAt: Date
}

const toStored = (p: DbPrediction): StoredPrediction => ({
  userId: p.userId, leagueId: p.leagueId, round: p.round, kind: p.kind, createdAt: p.createdAt,
  pick: { p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap },
})

/** Seasons that have at least one league, newest first. */
export async function leagueSeasons(): Promise<number[]> {
  const rows = await db.predictionLeague.findMany({ distinct: ['season'], select: { season: true }, orderBy: { season: 'desc' } })
  return rows.map((r) => r.season)
}

/** Global ranking of a season: first prediction of each race, default rules (see `firstPredictionPerRace`). */
export async function loadGlobalBoard(season: number) {
  const [predictions, outcomes] = await Promise.all([
    db.prediction.findMany({ where: { league: { season } } }),
    loadOutcomes(season),
  ])
  const board = leaderboardOf(firstPredictionPerRace(predictions.map(toStored)), outcomes, GLOBAL_RULES)
  const users = await db.user.findMany({
    where: { id: { in: board.map((e) => e.userId) } },
    select: { id: true, username: true, name: true },
  })
  const names = new Map(users.map((u) => [u.id, u.username ?? u.name ?? 'usuario']))
  const leagues = await db.predictionLeague.findMany({
    where: { season },
    select: { id: true, subreddit: { select: { name: true } }, _count: { select: { predictions: true } } },
    orderBy: { predictions: { _count: 'desc' } },
  })
  return { board, names, leagues: leagues.map((l) => ({ community: l.subreddit.name, predictions: l._count.predictions })) }
}

export interface Badge {
  key: string
  label: string
  detail: string
}

export interface ProfilePredictions {
  /** Season the stats belong to: the user's latest with predictions. */
  season: number
  stats: UserStats
  total: { predictions: number; scored: number; points: number }
  badges: Badge[]
}

const MAX_SEASONS = 6

/** Prediction stats and badges of a user, or null when they never predicted. Outcome failures drop only that season. */
export async function loadProfilePredictions(userId: string): Promise<ProfilePredictions | null> {
  const mine = await db.prediction.findMany({
    where: { userId },
    include: { league: { select: { season: true, subreddit: { select: { name: true } } } } },
  })
  if (mine.length === 0) return null

  const seasons = [...new Set(mine.map((p) => p.league.season))].sort((a, b) => b - a).slice(0, MAX_SEASONS)
  const total = { predictions: 0, scored: 0, points: 0 }
  const badges: Badge[] = []
  let latest: { season: number; stats: UserStats } | null = null

  for (const season of seasons) {
    const rows = firstPredictionPerRace(mine.filter((p) => p.league.season === season).map(toStored))
    let outcomes
    try {
      outcomes = await loadOutcomes(season)
    } catch {
      total.predictions += rows.length
      continue
    }
    const stats = computeUserStats(rows, outcomes, GLOBAL_RULES)
    total.predictions += stats.predictions
    total.scored += stats.scored
    total.points += stats.points
    if (!latest) latest = { season, stats }

    if (!isClosedSeason(season)) continue

    // Badges only for finished seasons: the title is decided.
    const everyone = await db.prediction.findMany({ where: { league: { season } } })
    if (champions(leaderboardOf(firstPredictionPerRace(everyone.map(toStored)), outcomes)).some((e) => e.userId === userId)) {
      badges.push({ key: `global:${season}`, label: `Campeón de pronósticos ${season}`, detail: 'Primero en la clasificación global' })
    }
    for (const league of new Map(mine.filter((p) => p.league.season === season).map((p) => [p.leagueId, p.league])).entries()) {
      const [leagueId, info] = league
      const row = await db.predictionLeague.findUnique({ where: { id: leagueId }, include: { predictions: true } })
      if (!row) continue
      const rules: LeagueRules = {
        exactPoints: row.exactPoints, presentPoints: row.presentPoints, fastestLapPoints: row.fastestLapPoints, sprintEnabled: row.sprintEnabled,
      }
      if (champions(leaderboardOf(row.predictions.map(toStored), outcomes, rules)).some((e) => e.userId === userId)) {
        badges.push({ key: `league:${leagueId}`, label: `Ganador de r/${info.subreddit.name} ${season}`, detail: 'Primero en la liga de la comunidad' })
      }
    }
  }

  if (!latest) return { season: seasons[0], stats: computeUserStats([], new Map()), total, badges }
  return { season: latest.season, stats: latest.stats, total, badges }
}
