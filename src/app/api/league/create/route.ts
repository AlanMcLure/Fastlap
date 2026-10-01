import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { currentSeason } from '@/lib/leagueData'
import { LeagueCreateValidator } from '@/lib/validators/league'

export const dynamic = 'force-dynamic'

/** Opens the prediction league of a community for the current season. Creator or admin only. */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const { subredditId, ...rules } = LeagueCreateValidator.parse(await req.json())

    const subreddit = await db.subreddit.findUnique({ where: { id: subredditId } })
    if (!subreddit) return new Response('Community not found', { status: 404 })
    if (subreddit.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
      return new Response('Only the creator can open a league', { status: 403 })
    }

    const league = await db.predictionLeague.create({
      data: { subredditId, season: await currentSeason(), ...rules },
    })
    return Response.json({ leagueId: league.id, season: league.season })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 422 })
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response('This community already has a league this season', { status: 409 })
    }
    console.error('League creation failed', error)
    return new Response('Could not create the league', { status: 500 })
  }
}
