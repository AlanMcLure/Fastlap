import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import type { Race } from '@/lib/f1/schemas'
import { RACE_THREAD_COMMUNITY, raceThreadContent, raceThreadTitle } from '@/lib/raceHub'

const SYSTEM_EMAIL = 'sistema@fastlap.invalid'

export interface RaceThread {
  postId: string
  community: string
}

async function findThread(season: number, round: number): Promise<RaceThread | null> {
  const weekend = await db.raceWeekend.findUnique({
    where: { season_round: { season, round } },
    include: { post: { include: { subreddit: true } } },
  })
  return weekend ? { postId: weekend.postId, community: weekend.post.subreddit.name } : null
}

/**
 * Returns the thread of a race weekend, creating it on first use: the system user,
 * the community and the post are created as needed, and the weekend row is unique per
 * race so two simultaneous visitors end up with one thread.
 */
export async function ensureRaceThread(race: Race): Promise<RaceThread> {
  const existing = await findThread(race.season, race.round)
  if (existing) return existing

  try {
    await db.$transaction(async (tx) => {
      const system = await tx.user.upsert({
        where: { email: SYSTEM_EMAIL },
        create: { email: SYSTEM_EMAIL, name: 'FastLap', username: 'fastlap' },
        update: {},
      })
      const community = await tx.subreddit.upsert({
        where: { name: RACE_THREAD_COMMUNITY },
        create: { name: RACE_THREAD_COMMUNITY, creatorId: system.id },
        update: {},
      })
      const post = await tx.post.create({
        data: {
          title: raceThreadTitle(race),
          content: raceThreadContent(race),
          authorId: system.id,
          subredditId: community.id,
        },
      })
      await tx.raceWeekend.create({ data: { season: race.season, round: race.round, postId: post.id } })
    })
  } catch (error) {
    // Lost the race against another visitor: the transaction rolled back, read theirs.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error
  }

  const created = await findThread(race.season, race.round)
  if (!created) throw new Error('Race thread could not be created')
  return created
}
