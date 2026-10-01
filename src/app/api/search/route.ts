import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessDashboard } from '@/lib/features'
import { getDrivers } from '@/lib/f1/queries'
import { emptyResults, escapeLike, matchDrivers, normalizeQuery, type SearchResults } from '@/lib/search'

export const dynamic = 'force-dynamic'

const DRIVER_TIMEOUT_MS = 1500

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

/**
 * One search over communities, users, post titles and (for signed-in users, who can open the
 * dashboard) drivers of the current season. Each group fails on its own: the F1 API being slow
 * or down only drops the drivers.
 */
export async function GET(req: Request) {
  const q = normalizeQuery(new URL(req.url).searchParams.get('q'))
  if (!q) return new Response('Invalid query', { status: 400 })

  const like = escapeLike(q)
  const session = await getAuthSession()
  const results: SearchResults = emptyResults()

  const [communities, users, posts, drivers] = await Promise.allSettled([
    db.subreddit.findMany({
      where: { name: { contains: like, mode: 'insensitive' } },
      select: { name: true, _count: { select: { subscribers: true } } },
      orderBy: { subscribers: { _count: 'desc' } },
      take: 4,
    }),
    db.user.findMany({
      where: { username: { contains: like, mode: 'insensitive' } },
      select: { username: true },
      orderBy: { username: 'asc' },
      take: 4,
    }),
    db.post.findMany({
      where: { title: { contains: like, mode: 'insensitive' } },
      select: { id: true, title: true, subreddit: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    session?.user && canAccessDashboard(session.user.role)
      ? withTimeout(getDrivers('current'), DRIVER_TIMEOUT_MS)
      : Promise.resolve([]),
  ])

  if (communities.status === 'fulfilled') {
    results.communities = communities.value.map((c) => ({ name: c.name, members: c._count.subscribers }))
  }
  if (users.status === 'fulfilled') {
    results.users = users.value.flatMap((u) => (u.username ? [{ username: u.username }] : []))
  }
  if (posts.status === 'fulfilled') {
    results.posts = posts.value.map((p) => ({ id: p.id, title: p.title, community: p.subreddit.name }))
  }
  if (drivers.status === 'fulfilled') {
    results.drivers = matchDrivers(drivers.value, q).map((d) => ({ id: d.driverId, name: `${d.givenName} ${d.familyName}` }))
  }

  return Response.json(results)
}
