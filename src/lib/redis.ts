import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_SECRET!,
})

export const postCacheKey = (postId: string) => `post:${postId}`

export async function invalidatePostCache(postId: string) {
  try {
    await redis.del(postCacheKey(postId))
  } catch {
    // the cache is an optimization; never fail the request because of it
  }
}
