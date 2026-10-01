import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ReportValidator, targetKey } from '@/lib/moderation'
import { reportDailyRatelimit, reportRatelimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/** A signed-in user reports a post or comment that is not their own. One report per user and target. */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const [minute, day] = await Promise.all([
      reportRatelimit.limit(session.user.id),
      reportDailyRatelimit.limit(session.user.id),
    ])
    if (!minute.success || !day.success) return new Response('Demasiadas denuncias. Inténtalo más tarde.', { status: 429 })

    const { type, id, reason, details } = ReportValidator.parse(await req.json())

    const target =
      type === 'POST'
        ? await db.post.findUnique({ where: { id }, select: { authorId: true } })
        : await db.comment.findUnique({ where: { id }, select: { authorId: true } })
    if (!target) return new Response('Content not found', { status: 404 })
    if (target.authorId === session.user.id) return new Response('No puedes denunciar tu propio contenido', { status: 400 })

    await db.report.create({
      data: {
        reporterId: session.user.id,
        targetKey: targetKey(type, id),
        ...(type === 'POST' ? { postId: id } : { commentId: id }),
        reason,
        details: details || null,
      },
    })
    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 422 })
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response('Ya has denunciado este contenido', { status: 409 })
    }
    console.error('Report failed', error)
    return new Response('Could not save the report', { status: 500 })
  }
}
