import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

export const voteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  prefix: 'rl:vote',
})

export const postRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:post',
})

export const commentRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:comment',
})

/** Reports: a few per minute and a daily cap, so the queue cannot be flooded. */
export const reportRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:report',
})

export const reportDailyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 d'),
  prefix: 'rl:report-day',
})

/** Account deletion is irreversible: a few attempts per hour is plenty. */
export const accountDeleteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:account-delete',
})

/** Data export reads many tables: a few downloads per hour is plenty. */
export const accountExportRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:account-export',
})
