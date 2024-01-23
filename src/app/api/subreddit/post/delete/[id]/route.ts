import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
  ) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    await db.comment.updateMany({
      where: {
        postId: params.id,
      },
      data: {
        replyToId: null,
      },
    })

    await db.post.delete({
      where: {
        id: params.id,
      },
    })

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