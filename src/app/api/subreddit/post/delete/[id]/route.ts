import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { invalidatePostCache } from '@/lib/redis'
import { z } from 'zod';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const post = await db.post.findUnique({
      where: { id },
    });

    if (!post) {
      return new Response('Post not found', { status: 404 });
    }

    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return new Response('Forbidden', { status: 403 });
    }

    await db.comment.updateMany({
      where: { postId: id },
      data: { replyToId: null },
    })

    await db.post.delete({
      where: { id },
    })
    await invalidatePostCache(id)

    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    return new Response(
      'Could not delete post at this time. Please try later',
      { status: 500 }
    )
  }
}