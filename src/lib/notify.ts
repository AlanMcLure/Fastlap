import 'server-only'

import { db } from '@/lib/db'
import { raceStatus } from '@/lib/f1/calendar'
import { getCalendar } from '@/lib/f1/queries'
import { outcomeKey, predictionDeadline, scorePrediction, type LeagueRules } from '@/lib/league'
import { loadOutcomes } from '@/lib/leagueData'
import {
  closingBody, closingKey, closingSoon, recentRace, scoredBody, scoredKey, type NewNotification,
} from '@/lib/notifications'
import { redis } from '@/lib/redis'

/** Stores notifications; duplicates (same user and dedupe key) are skipped. Never throws: a notification must not break the action that caused it. */
export async function createNotifications(items: NewNotification[]) {
  if (items.length === 0) return
  try {
    await db.notification.createMany({ data: items, skipDuplicates: true })
  } catch (error) {
    console.error('Could not create notifications', error)
  }
}

const SYNC_EVERY_SECONDS = 600

/**
 * Generates the time-based notifications of a user: "predictions close soon" for the next race of
 * the leagues they take part in, and "you scored N points" for recent races. There is no scheduler,
 * so it runs when the user's bell polls, at most once every 10 minutes (Redis lock), and is
 * idempotent thanks to the dedupe keys.
 */
export async function syncLeagueNotifications(userId: string, now = new Date()) {
  try {
    const locked = await redis.set(`notif:sync:${userId}`, '1', { nx: true, ex: SYNC_EVERY_SECONDS })
    if (!locked) return
  } catch {
    return // without the lock every poll would recompute: better to skip
  }

  try {
    const leagues = await db.predictionLeague.findMany({
      where: {
        OR: [
          { subreddit: { subscribers: { some: { userId } } } },
          { predictions: { some: { userId } } },
        ],
      },
      include: { subreddit: { select: { name: true } }, predictions: { where: { userId } } },
    })

    const items: NewNotification[] = []
    for (const league of leagues) {
      const rules: LeagueRules = {
        exactPoints: league.exactPoints,
        presentPoints: league.presentPoints,
        fastestLapPoints: league.fastestLapPoints,
        sprintEnabled: league.sprintEnabled,
      }
      const href = `/r/${league.subreddit.name}/liga`
      const races = await getCalendar(league.season)

      const next = races.find((r) => raceStatus(r, now) !== 'finished')
      if (next) {
        for (const kind of ['RACE', 'SPRINT'] as const) {
          if (kind === 'SPRINT' && !league.sprintEnabled) continue
          const deadline = predictionDeadline(next, kind)
          const has = league.predictions.some((p) => p.round === next.round && p.kind === kind)
          if (deadline && closingSoon(deadline, now) && !has) {
            items.push({
              userId, type: 'PREDICTION_CLOSING', href,
              body: closingBody(league.subreddit.name, next.raceName, kind, deadline, now),
              dedupeKey: closingKey(league.id, next.round, kind),
            })
          }
        }
      }

      const recent = league.predictions.filter((p) => {
        const race = races.find((r) => r.round === p.round)
        return race && recentRace(race.date, now)
      })
      if (recent.length > 0) {
        const outcomes = await loadOutcomes(league.season)
        for (const p of recent) {
          const outcome = outcomes.get(outcomeKey(p.round, p.kind))
          const race = races.find((r) => r.round === p.round)
          if (!outcome || !race) continue
          const score = scorePrediction({ p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap }, outcome, rules, p.kind)
          items.push({
            userId, type: 'PREDICTION_SCORED', href,
            body: scoredBody(league.subreddit.name, race.raceName, p.kind, score.total),
            dedupeKey: scoredKey(league.id, p.round, p.kind),
          })
        }
      }
    }
    await createNotifications(items)
  } catch (error) {
    console.error('Could not sync league notifications', error)
  }
}
