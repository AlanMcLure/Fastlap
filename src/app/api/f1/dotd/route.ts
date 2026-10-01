import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { dotdTally } from '@/lib/dotd'
import { getRaceResults } from '@/lib/f1/queries'
import { voteRatelimit } from '@/lib/ratelimit'
import { dotdState } from '@/lib/raceHub'
import { DriverOfDayValidator } from '@/lib/validators/dotd'

export const dynamic = 'force-dynamic'

/** Casts or changes the caller's Driver of the Day vote and returns the new tally. */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const { success } = await voteRatelimit.limit(session.user.id)
    if (!success) return new Response('Too many requests', { status: 429 })

    const { season, round, driverId } = DriverOfDayValidator.parse(await req.json())

    const race = await getRaceResults(season, round)
    if (!race) return new Response('Race has no results yet', { status: 409 })
    if (dotdState(race, race.Results.length > 0) !== 'open') {
      return new Response('Voting is not open for this race', { status: 409 })
    }
    if (!race.Results.some((r) => r.Driver.driverId === driverId)) {
      return new Response('Driver did not take part in this race', { status: 422 })
    }

    await db.driverOfDayVote.upsert({
      where: { userId_season_round: { userId: session.user.id, season, round } },
      create: { userId: session.user.id, season, round, driverId },
      update: { driverId },
    })

    return Response.json({ mine: driverId, tally: await dotdTally(season, round) })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 422 })
    console.error('Driver of the Day vote failed', error)
    return new Response('Could not register the vote', { status: 500 })
  }
}
