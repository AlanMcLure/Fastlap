import { db } from '@/lib/db'
import { buildLeaderboard, type LeagueRules } from '@/lib/league'
import { loadOutcomes } from '@/lib/leagueData'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'
import { toRows, type StoredPrediction } from '@/lib/profileStats'
import { leaderboardRows } from '@/lib/shareCards'
import { withTimeout } from '@/lib/timeout'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Liga de pronósticos de una comunidad de FastLap'
export const dynamic = 'force-dynamic'

/** Share card of a community's prediction league: the top of its table. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let kicker = 'Liga de pronósticos'
  let rows: ReturnType<typeof leaderboardRows> = []
  try {
    const league = await db.predictionLeague.findFirst({
      where: { subreddit: { name: slug } },
      orderBy: { season: 'desc' },
      include: { predictions: true },
    })
    if (league) {
      kicker = `Liga de pronósticos · temporada ${league.season}`
      const rules: LeagueRules = {
        exactPoints: league.exactPoints, presentPoints: league.presentPoints,
        fastestLapPoints: league.fastestLapPoints, sprintEnabled: league.sprintEnabled,
      }
      const outcomes = await withTimeout(loadOutcomes(league.season), 3000)
      const stored: StoredPrediction[] = league.predictions.map((p) => ({
        userId: p.userId, leagueId: p.leagueId, round: p.round, kind: p.kind, createdAt: p.createdAt,
        pick: { p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap },
      }))
      const board = buildLeaderboard(toRows(stored), outcomes, rules).filter((e) => e.scored > 0)
      const users = await db.user.findMany({
        where: { id: { in: board.slice(0, 3).map((e) => e.userId) } },
        select: { id: true, username: true, name: true },
      })
      rows = leaderboardRows(board, new Map(users.map((u) => [u.id, `u/${u.username ?? u.name ?? 'usuario'}`])))
    }
  } catch {
    // without results the card shows only the title
  }
  return ogImage({ kicker, title: `r/${slug}`, rows, note: rows.length === 0 ? 'Pronostica el podio de cada Gran Premio' : undefined })
}
