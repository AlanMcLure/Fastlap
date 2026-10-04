import type { VoteType } from '@prisma/client'
import { z } from 'zod'

import { PAGINATION_RESULTS } from '@/config'

/** Most posts one feed request may ask for. */
export const FEED_MAX_LIMIT = 20

/** Query of `GET /api/posts`: optional community or author filter, cursor = id of the last post already shown. */
export const FeedQuery = z.object({
  subredditName: z.string().min(1).max(64).optional(),
  username: z.string().min(1).max(64).optional(),
  cursor: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(FEED_MAX_LIMIT).default(PAGINATION_RESULTS),
})

/**
 * Rows are fetched with one extra item: when it comes back there is a next page, and its cursor
 * is the id of the last row actually returned.
 */
export function pageWithCursor<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null }
}

/** Net score per post (up minus down) from a `groupBy` over votes; posts with no votes are absent (0). */
export function tallyVotes(groups: { postId: string; type: VoteType; _count: { _all: number } }[]) {
  const totals = new Map<string, number>()
  for (const g of groups) {
    totals.set(g.postId, (totals.get(g.postId) ?? 0) + (g.type === 'UP' ? 1 : -1) * g._count._all)
  }
  return totals
}
