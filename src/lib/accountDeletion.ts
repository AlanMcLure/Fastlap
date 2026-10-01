import 'server-only'

import { nanoid } from 'nanoid'

import { anonymizeActor, DELETED_USER } from '@/lib/accountRules'
import { db } from '@/lib/db'
import { invalidatePostCache } from '@/lib/redis'

/**
 * Deletes an account. What the person wrote stays, attributed to the shared "eliminado"
 * user, so threads keep making sense; everything that identifies or profiles them goes:
 * profile, login links, sessions, votes, subscriptions, predictions, driver-of-the-day
 * votes, notifications and the reports they filed. Communities they created lose their
 * creator. Returns false when the user no longer exists.
 */
export async function deleteAccount(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, username: true } })
  if (!user) return false

  const postIds = (await db.post.findMany({ where: { authorId: userId }, select: { id: true } })).map((p) => p.id)

  await db.$transaction(
    async (tx) => {
      const ghost = await upsertDeletedUser(tx)

      await tx.post.updateMany({ where: { authorId: userId }, data: { authorId: ghost.id } })
      await tx.comment.updateMany({ where: { authorId: userId }, data: { authorId: ghost.id } })

      await tx.vote.deleteMany({ where: { userId } })
      await tx.commentVote.deleteMany({ where: { userId } })
      await tx.subscription.deleteMany({ where: { userId } })
      await tx.subreddit.updateMany({ where: { creatorId: userId }, data: { creatorId: null } })

      await tx.moderationLog.updateMany({ where: { authorId: userId }, data: { authorId: null } })
      await tx.moderationLog.updateMany({ where: { moderatorId: userId }, data: { moderatorId: ghost.id } })

      if (user.username) {
        const quoted = await tx.notification.findMany({
          where: { body: { contains: `u/${user.username} ` } },
          select: { id: true, body: true },
        })
        for (const n of quoted) {
          const body = anonymizeActor(n.body, user.username)
          if (body !== n.body) await tx.notification.update({ where: { id: n.id }, data: { body } })
        }
      }

      // Cascades: Account, Session, DriverOfDayVote, Prediction, Notification, Report (as reporter).
      await tx.user.delete({ where: { id: userId } })
    },
    { timeout: 30_000 }
  )

  // The hot-post cache holds the author's username.
  await Promise.all(postIds.map((id) => invalidatePostCache(id).catch(() => undefined)))
  return true
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]

async function upsertDeletedUser(tx: Tx) {
  const existing = await tx.user.findUnique({ where: { email: DELETED_USER.email } })
  if (existing) return existing

  // Another user could already own the name: fall back to a suffixed one.
  const taken = await tx.user.findUnique({ where: { username: DELETED_USER.username } })
  return tx.user.create({
    data: {
      email: DELETED_USER.email,
      name: DELETED_USER.name,
      username: taken ? `${DELETED_USER.username}_${nanoid(4)}` : DELETED_USER.username,
    },
  })
}
