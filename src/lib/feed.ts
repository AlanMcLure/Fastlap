import 'server-only'

import type { Prisma, VoteType } from '@prisma/client'

import { PAGINATION_RESULTS } from '@/config'
import { db } from '@/lib/db'
import { pageWithCursor, tallyVotes } from '@/lib/feedRules'

/**
 * The only user fields that may reach other people (pages, API responses, client components).
 * Never `include: { author: true }` where the result leaves the server: it carries email, role…
 */
export const publicUserSelect = { username: true, image: true } satisfies Prisma.UserSelect

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>

/** A post as shown in a feed: totals instead of raw votes (who voted what stays private). */
export interface FeedPost {
  id: string
  title: string
  content: Prisma.JsonValue
  createdAt: Date | string
  authorId: string
  author: PublicUser
  subreddit: { name: string }
  votesAmt: number
  currentVote: VoteType | null
  commentAmt: number
}

export type FeedScope =
  | { kind: 'home'; viewerId?: string }
  | { kind: 'community'; name: string }
  | { kind: 'user'; username: string }

export interface FeedPage {
  posts: FeedPost[]
  nextCursor: string | null
  /** Home feed of a signed-in user who follows no community: they see every post instead. */
  showingAll?: boolean
}

async function scopeFilter(scope: FeedScope): Promise<{ where: Prisma.PostWhereInput; showingAll?: boolean }> {
  if (scope.kind === 'community') return { where: { subreddit: { name: scope.name } } }
  if (scope.kind === 'user') return { where: { author: { username: scope.username } } }
  if (!scope.viewerId) return { where: {} }
  const followed = await db.subscription.findMany({ where: { userId: scope.viewerId }, select: { subredditId: true } })
  if (followed.length === 0) return { where: {}, showingAll: true }
  return { where: { subredditId: { in: followed.map((f) => f.subredditId) } } }
}

/** One page of posts, newest first, continuing after `cursor` (the id of the last post already shown). */
export async function getFeedPage({
  scope,
  viewerId,
  cursor,
  limit = PAGINATION_RESULTS,
}: {
  scope: FeedScope
  viewerId?: string
  cursor?: string
  limit?: number
}): Promise<FeedPage> {
  const { where, showingAll } = await scopeFilter(scope)
  const rows = await db.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      authorId: true,
      author: { select: publicUserSelect },
      subreddit: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  })
  const { items, nextCursor } = pageWithCursor(rows, limit)
  const ids = items.map((p) => p.id)

  const [groups, mine] = await Promise.all([
    ids.length ? db.vote.groupBy({ by: ['postId', 'type'], where: { postId: { in: ids } }, _count: { _all: true } }) : [],
    viewerId && ids.length
      ? db.vote.findMany({ where: { userId: viewerId, postId: { in: ids } }, select: { postId: true, type: true } })
      : [],
  ])
  const totals = tallyVotes(groups)
  const myVotes = new Map(mine.map((v) => [v.postId, v.type]))

  return {
    posts: items.map(({ _count, ...post }) => ({
      ...post,
      votesAmt: totals.get(post.id) ?? 0,
      currentVote: myVotes.get(post.id) ?? null,
      commentAmt: _count.comments,
    })),
    nextCursor,
    showingAll,
  }
}
