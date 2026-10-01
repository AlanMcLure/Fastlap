import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import NotificationList from '@/components/NotificationList'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Notificaciones' }

const LIMIT = 50

const NotificationsPage = async () => {
  const session = await getAuthSession()
  if (!session?.user) redirect('/sign-in')

  const rows = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: LIMIT,
  })

  return (
    <div className='mx-auto max-w-3xl space-y-6 py-6'>
      <header>
        <p className='label'>TU ACTIVIDAD</p>
        <h1 className='mt-2 text-3xl font-bold text-display'>Notificaciones</h1>
      </header>

      {rows.length === 0 ? (
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
          Todavía no tienes notificaciones. Te avisaremos cuando respondan a tus comentarios, comenten tus publicaciones,
          se cierren los pronósticos de tus ligas o tengas puntos nuevos.
        </p>
      ) : (
        <NotificationList
          items={rows.map((r) => ({
            id: r.id,
            body: r.body,
            href: r.href,
            read: r.readAt !== null,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      )}
      {rows.length === LIMIT && <p className='label'>MOSTRANDO LAS {LIMIT} MÁS RECIENTES</p>}
    </div>
  )
}

export default NotificationsPage
