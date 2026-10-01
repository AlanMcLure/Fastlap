import { db } from '@/lib/db'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const CHECK_TIMEOUT_MS = 2000

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

async function check(run: () => Promise<unknown>): Promise<'ok' | 'down'> {
  try {
    await withTimeout(run(), CHECK_TIMEOUT_MS)
    return 'ok'
  } catch {
    return 'down'
  }
}

/**
 * Health check for the hosting / Docker HEALTHCHECK / uptime monitors. 200 when the app can reach its
 * database (it cannot work without it); Redis down is reported but only degrades (rate limits and the
 * hot-post cache), so it does not take the instance out of rotation. No secrets or details are exposed.
 */
export async function GET() {
  const [database, cache] = await Promise.all([check(() => db.$queryRaw`SELECT 1`), check(() => redis.ping())])
  const status = database === 'ok' ? (cache === 'ok' ? 'ok' : 'degraded') : 'down'
  return Response.json(
    { status, database, cache, time: new Date().toISOString() },
    { status: database === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
