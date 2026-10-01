import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const Body = z.object({ id: z.string().optional() })

/** Marks one notification (`id`) or all of the caller's as read. Only their own are touched. */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const { id } = Body.parse(await req.json().catch(() => ({})))
    const { count } = await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null, ...(id ? { id } : {}) },
      data: { readAt: new Date() },
    })
    return Response.json({ marked: count })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response('Invalid request', { status: 422 })
    console.error('Could not mark notifications', error)
    return new Response('Could not update', { status: 500 })
  }
}
