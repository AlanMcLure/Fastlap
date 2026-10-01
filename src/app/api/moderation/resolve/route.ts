import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { deleteComment, deletePost } from '@/lib/content'
import { db } from '@/lib/db'
import { removedBody, ResolveValidator, targetKey } from '@/lib/moderation'
import { excerpt } from '@/lib/notifications'
import { createNotifications } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/**
 * Admin decision on a reported target: `remove` deletes the content (and tells its author),
 * `dismiss` closes the reports and keeps it. Both are recorded in the moderation log.
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })
    if (session.user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 })

    const { type, id, action } = ResolveValidator.parse(await req.json())
    const key = targetKey(type, id)

    const reportCount = await db.report.count({ where: { targetKey: key, status: 'OPEN' } })
    if (reportCount === 0) return new Response('No open reports for this content', { status: 404 })

    if (action === 'dismiss') {
      const content =
        type === 'POST'
          ? await db.post.findUnique({ where: { id }, select: { title: true, authorId: true } })
          : await db.comment.findUnique({ where: { id }, select: { text: true, authorId: true } })
      await db.$transaction([
        db.report.updateMany({ where: { targetKey: key, status: 'OPEN' }, data: { status: 'DISMISSED', resolvedAt: new Date() } }),
        db.moderationLog.create({
          data: {
            moderatorId: session.user.id, action: 'DISMISS', targetKey: key, reportCount,
            excerpt: content ? excerpt('title' in content ? content.title : content.text, 100) : '(contenido ya eliminado)',
            authorId: content?.authorId,
          },
        }),
      ])
      return Response.json({ ok: true })
    }

    // remove
    if (type === 'POST') {
      const post = await db.post.findUnique({
        where: { id },
        select: { title: true, authorId: true, subreddit: { select: { name: true } } },
      })
      if (!post) return new Response('Content not found', { status: 404 })
      await db.moderationLog.create({
        data: { moderatorId: session.user.id, action: 'REMOVE_POST', targetKey: key, reportCount, excerpt: excerpt(post.title, 100), authorId: post.authorId },
      })
      await deletePost(id)
      await createNotifications([
        { userId: post.authorId, type: 'MOD_REMOVED', body: removedBody('POST', excerpt(post.title, 60)), href: `/r/${post.subreddit.name}` },
      ])
    } else {
      const comment = await db.comment.findUnique({
        where: { id },
        select: { text: true, authorId: true, post: { select: { id: true, subreddit: { select: { name: true } } } } },
      })
      if (!comment) return new Response('Content not found', { status: 404 })
      await db.moderationLog.create({
        data: { moderatorId: session.user.id, action: 'REMOVE_COMMENT', targetKey: key, reportCount, excerpt: excerpt(comment.text, 100), authorId: comment.authorId },
      })
      await deleteComment(id)
      await createNotifications([
        {
          userId: comment.authorId, type: 'MOD_REMOVED', body: removedBody('COMMENT', excerpt(comment.text, 60)),
          href: `/r/${comment.post.subreddit.name}/post/${comment.post.id}`,
        },
      ])
    }
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 422 })
    console.error('Moderation action failed', error)
    return new Response('Could not apply the action', { status: 500 })
  }
}
