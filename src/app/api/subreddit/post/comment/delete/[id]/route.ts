import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const comment = await db.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return new Response('Comment not found', { status: 404 })
    }

    await db.comment.updateMany({
      where: { replyToId: id },
      data: { replyToId: null },
    })

    await db.comment.delete({
      where: { id },
    })

    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    return new Response(
      'No se pudo eliminar el comentario en este momento. Por favor, inténtelo más tarde',
      { status: 500 }
    )
  }
}