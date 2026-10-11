import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { getFeedPage, type FeedScope } from '@/lib/feed'
import { FeedQuery } from '@/lib/feedRules'

export const dynamic = 'force-dynamic'

/** Next page of a feed: a community, a user's posts, everything (`feed=all`) or the home feed (followed communities, else everything). */
export async function GET(req: Request) {
  try {
    const params = Object.fromEntries(
      [...new URL(req.url).searchParams].filter(([, value]) => value !== '')
    )
    const { subredditName, username, cursor, limit, feed } = FeedQuery.parse(params)
    const session = await getAuthSession()
    const viewerId = session?.user?.id

    const scope: FeedScope = subredditName
      ? { kind: 'community', name: subredditName }
      : username
        ? { kind: 'user', username }
        : feed === 'all'
          ? { kind: 'all' }
          : { kind: 'home', viewerId }

    const page = await getFeedPage({ scope, viewerId, cursor, limit })
    return Response.json(page, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 400 })
    console.error('Feed failed', error)
    return new Response('Could not fetch posts', { status: 500 })
  }
}
