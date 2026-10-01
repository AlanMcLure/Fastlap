import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCalendar, getDrivers } from '@/lib/f1/queries'
import { pickProblem, predictionDeadline } from '@/lib/league'
import { voteRatelimit } from '@/lib/ratelimit'
import { PredictionValidator } from '@/lib/validators/league'

export const dynamic = 'force-dynamic'

/** Saves (or changes, until the deadline) the caller's prediction for a race or sprint. */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const { success } = await voteRatelimit.limit(session.user.id)
    if (!success) return new Response('Too many requests', { status: 429 })

    const { leagueId, round, kind, ...pick } = PredictionValidator.parse(await req.json())

    const league = await db.predictionLeague.findUnique({ where: { id: leagueId } })
    if (!league) return new Response('League not found', { status: 404 })
    if (kind === 'SPRINT' && !league.sprintEnabled) return new Response('Sprints are not part of this league', { status: 409 })

    const race = (await getCalendar(league.season)).find((r) => r.round === round)
    if (!race) return new Response('Race not found', { status: 404 })

    const deadline = predictionDeadline(race, kind)
    if (!deadline) return new Response('This weekend has no sprint', { status: 409 })
    if (Date.now() >= deadline.getTime()) return new Response('Predictions are closed', { status: 409 })

    const drivers = new Set((await getDrivers(league.season)).map((d) => d.driverId))
    const problem = pickProblem(pick, drivers, kind)
    if (problem) return new Response(problem, { status: 422 })

    const data = { p1: pick.p1, p2: pick.p2, p3: pick.p3, fastestLap: kind === 'RACE' ? (pick.fastestLap ?? null) : null }
    await db.prediction.upsert({
      where: { userId_leagueId_round_kind: { userId: session.user.id, leagueId, round, kind } },
      create: { userId: session.user.id, leagueId, round, kind, ...data },
      update: data,
    })
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 422 })
    console.error('Prediction failed', error)
    return new Response('Could not save the prediction', { status: 500 })
  }
}
