import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { postRatelimit } from '@/lib/ratelimit'
import { PostValidator } from '@/lib/validators/post'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { title, content, subredditId } = PostValidator.parse(body)

    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { success } = await postRatelimit.limit(session.user.id)
    if (!success) {
      return new Response('Demasiadas peticiones. Espera un momento.', { status: 429 })
    }

    // verify user is subscribed to passed subreddit id
    const subscription = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    })

    if (!subscription) {
      return new Response('Subscribe to post', { status: 403 })
    }

    await db.post.create({
      data: {
        title,
        content: content ?? undefined,
        authorId: session.user.id,
        subredditId,
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
