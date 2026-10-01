import { after } from 'next/server'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { syncLeagueNotifications } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** Unread count for the bell. Time-based notifications are generated in the background after answering. */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const userId = session.user.id
  after(() => syncLeagueNotifications(userId))

  const count = await db.notification.count({ where: { userId, readAt: null } })
  return Response.json({ count })
}
