import { describe, expect, it } from 'vitest'

import { FeedQuery, FEED_MAX_LIMIT, pageWithCursor, tallyVotes } from './feedRules'

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }))

describe('pageWithCursor', () => {
  it('returns the page and the cursor of its last item when one more row came back', () => {
    expect(pageWithCursor(rows(7), 6)).toEqual({ items: rows(6), nextCursor: 'p5' })
  })
  it('has no next page when the extra row is missing', () => {
    expect(pageWithCursor(rows(6), 6)).toEqual({ items: rows(6), nextCursor: null })
    expect(pageWithCursor(rows(2), 6)).toEqual({ items: rows(2), nextCursor: null })
    expect(pageWithCursor([], 6)).toEqual({ items: [], nextCursor: null })
  })
})

describe('tallyVotes', () => {
  it('nets up and down votes per post', () => {
    const totals = tallyVotes([
      { postId: 'a', type: 'UP', _count: { _all: 3 } },
      { postId: 'a', type: 'DOWN', _count: { _all: 5 } },
      { postId: 'b', type: 'UP', _count: { _all: 1 } },
    ])
    expect(totals.get('a')).toBe(-2)
    expect(totals.get('b')).toBe(1)
    expect(totals.get('c')).toBeUndefined()
  })
})

describe('FeedQuery', () => {
  it('defaults the limit and drops empty filters', () => {
    expect(FeedQuery.parse({})).toEqual({ limit: 6 })
  })
  it('coerces the limit from the query string and caps it', () => {
    expect(FeedQuery.parse({ limit: '10' }).limit).toBe(10)
    expect(FeedQuery.safeParse({ limit: String(FEED_MAX_LIMIT + 1) }).success).toBe(false)
    expect(FeedQuery.safeParse({ limit: 'abc' }).success).toBe(false)
    expect(FeedQuery.safeParse({ limit: '0' }).success).toBe(false)
  })
})
