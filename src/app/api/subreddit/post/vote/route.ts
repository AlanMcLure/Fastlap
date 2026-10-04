import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { voteRatelimit } from '@/lib/ratelimit'
import { PostVoteValidator } from '@/lib/validators/vote'
import { z } from 'zod'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { postId, voteType } = PostVoteValidator.parse(body)

    const session = await getAuthSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { success } = await voteRatelimit.limit(session.user.id)
    if (!success) {
      return new Response('Demasiadas peticiones. Espera un momento.', { status: 429 })
    }

    const existingVote = await db.vote.findFirst({
      where: { userId: session.user.id, postId },
    })

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return new Response('Post not found', { status: 404 })
    }

    if (existingVote) {
      // same vote → toggle off
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: { userId_postId: { postId, userId: session.user.id } },
        })
        return new Response('OK')
      }

      // different vote → flip
      await db.vote.update({
        where: { userId_postId: { postId, userId: session.user.id } },
        data: { type: voteType },
      })
      return new Response('OK')
    }

    // no existing vote → create
    await db.vote.create({
      data: { type: voteType, userId: session.user.id, postId },
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
