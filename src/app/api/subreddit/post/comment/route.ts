import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
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

    // if no existing vote, create a new vote
    await db.comment.create({
      data: {
        text,
        postId,
        authorId: session.user.id,
        replyToId,
      },
    })

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
