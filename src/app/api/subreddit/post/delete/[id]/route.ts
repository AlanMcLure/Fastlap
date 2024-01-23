import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { DeletePostValidator } from '@/lib/validators/post'

export async function DELETE(req: Request) {
  try {
    const body = await req.json()

    console.log(body);

    const { postId, subredditId } = DeletePostValidator.parse(body)

    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // verify user is subscribed to passed subreddit id
    const subscription = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    })

    if (!subscription) {
      return new Response('Subscribe to delete post', { status: 403 })
    }

    // verify the user is the author of the post
    const post = await db.post.findFirst({
      where: {
        id: postId,
        authorId: session.user.id,
      },
    })

    if (!post) {
      return new Response('Not authorized to delete this post', { status: 403 })
    }

    console.log('Deleting post with id:', postId);

    await db.post.delete({
      where: {
        id: postId,
      },
    })

    console.log('Post deleted successfully');

    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    console.log(error);

    return new Response(
      'Could not delete post at this time. Please try later',
      { status: 500 }
    )
  }
}