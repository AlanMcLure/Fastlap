import 'server-only'

import { db } from '@/lib/db'

export const EXPORT_VERSION = 1

/** File name of the download, e.g. `fastlap-datos-ana_f1-2026-10-01.json`. */
export function exportFileName(username: string | null, now = new Date()): string {
  const safe = (username ?? 'usuario').replace(/[^a-zA-Z0-9_-]/g, '')
  return `fastlap-datos-${safe || 'usuario'}-${now.toISOString().slice(0, 10)}.json`
}

/**
 * Everything the app keeps about one user (RGPD art. 15 and 20), as plain data that
 * serializes to JSON. Login credentials (session tokens, provider tokens) are left out on
 * purpose: they are secrets, not the person's data. Returns null when the user is gone.
 *
 * Keep it in step with `deleteAccount`: a model with a user relation belongs in both.
 */
export async function collectUserData(userId: string, now = new Date()) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true, image: true, role: true, createdAt: true, updatedAt: true },
  })
  if (!user) return null

  const [
    accounts,
    subscriptions,
    createdCommunities,
    posts,
    comments,
    postVotes,
    commentVotes,
    driverOfTheDayVotes,
    predictions,
    notifications,
    reportsMade,
    moderationLog,
  ] = await Promise.all([
    db.account.findMany({
      where: { userId },
      select: { provider: true, providerAccountId: true, type: true },
    }),
    db.subscription.findMany({ where: { userId }, select: { subreddit: { select: { name: true } } } }),
    db.subreddit.findMany({ where: { creatorId: userId }, select: { name: true, createdAt: true } }),
    db.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, content: true, createdAt: true, updatedAt: true, subreddit: { select: { name: true } } },
    }),
    db.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, text: true, createdAt: true, postId: true, replyToId: true },
    }),
    db.vote.findMany({ where: { userId }, select: { postId: true, type: true } }),
    db.commentVote.findMany({ where: { userId }, select: { commentId: true, type: true } }),
    db.driverOfDayVote.findMany({
      where: { userId },
      orderBy: [{ season: 'asc' }, { round: 'asc' }],
      select: { season: true, round: true, driverId: true, createdAt: true },
    }),
    db.prediction.findMany({
      where: { userId },
      orderBy: [{ league: { season: 'asc' } }, { round: 'asc' }],
      select: {
        round: true,
        kind: true,
        p1: true,
        p2: true,
        p3: true,
        fastestLap: true,
        createdAt: true,
        updatedAt: true,
        league: { select: { season: true, subreddit: { select: { name: true } } } },
      },
    }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { type: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    db.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'asc' },
      select: { targetKey: true, reason: true, details: true, status: true, createdAt: true },
    }),
    db.moderationLog.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'asc' },
      select: { action: true, targetKey: true, excerpt: true, createdAt: true },
    }),
  ])

  return {
    exportVersion: EXPORT_VERSION,
    generatedAt: now.toISOString(),
    notice:
      'Copia de los datos personales que FastLap guarda sobre ti. No incluye credenciales (cookies de sesión). ' +
      'Los votos de otras personas sobre tus publicaciones y las conversaciones de terceros no se incluyen.',
    profile: user,
    loginMethods: accounts,
    communitiesFollowed: subscriptions.map((s) => s.subreddit.name),
    communitiesCreated: createdCommunities,
    posts: posts.map(({ subreddit, ...p }) => ({ ...p, community: subreddit.name })),
    comments,
    postVotes,
    commentVotes,
    driverOfTheDayVotes,
    predictions: predictions.map(({ league, ...p }) => ({
      ...p,
      season: league.season,
      community: league.subreddit.name,
    })),
    notifications,
    reportsMade,
    moderationDecisionsAboutYourContent: moderationLog,
  }
}
