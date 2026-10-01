import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { commentNotifications } from '@/lib/notifications'
import { createNotifications } from '@/lib/notify'
import { commentRatelimit } from '@/lib/ratelimit'
import { CommentValidator } from '@/lib/validators/comment'
import { z } from 'zod'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const { postId, text, replyToId } = CommentValidator.parse(body)

    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { success } = await commentRatelimit.limit(session.user.id)
    if (!success) {
      return new Response('Demasiadas peticiones. Espera un momento.', { status: 429 })
    }

    await db.comment.create({
      data: {
        text,
        postId,
        authorId: session.user.id,
        replyToId,
      },
    })

    // Notify the post's author and the author of the comment replied to (best effort).
    const [post, parent] = await Promise.all([
      db.post.findUnique({
        where: { id: postId },
        select: { title: true, authorId: true, subreddit: { select: { name: true } } },
      }),
      replyToId ? db.comment.findUnique({ where: { id: replyToId }, select: { authorId: true } }) : null,
    ])
    if (post) {
      await createNotifications(
        commentNotifications({
          actorId: session.user.id,
          actorName: session.user.username ? `u/${session.user.username}` : 'Alguien',
          commentText: text,
          postId,
          postTitle: post.title,
          postAuthorId: post.authorId,
          community: post.subreddit.name,
          parentAuthorId: parent?.authorId,
        })
      )
    }

    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    return new Response(
      'Could not post to subreddit at this time. Please try later',
      { status: 500 }
    )
  }
}
