import Link from 'next/link'

import SubscribeLeaveToggle from '@/components/SubscribeLeaveToggle'
import { db } from '@/lib/db'

const section = 'border-b border-border py-5 first:pt-0'

/** Communities the viewer does not follow yet, most followed first. */
async function suggestedCommunities(viewerId?: string) {
  return db.subreddit.findMany({
    where: viewerId ? { subscribers: { none: { userId: viewerId } } } : {},
    select: { id: true, name: true, _count: { select: { subscribers: true } } },
    orderBy: { subscribers: { _count: 'desc' } },
    take: 3,
  })
}

/**
 * Right column of the home page: no boxes, sections divided by lines. Predictions, communities to
 * join, the daily game and a way to start a community.
 */
const HomeRail = async ({ viewerId }: { viewerId?: string }) => {
  const communities = await suggestedCommunities(viewerId).catch(() => [])

  return (
    <div className='flex flex-col'>
      <section className={section}>
        <p className='label'>PRONÓSTICOS</p>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          Acierta el podio de cada Gran Premio en la liga de tus comunidades y sube en la clasificación global.
        </p>
        <Link
          href='/pronosticos'
          className='mt-3 flex items-center justify-between text-sm text-display underline-offset-4 hover:underline'>
          Ver la clasificación <span aria-hidden='true'>→</span>
        </Link>
      </section>

      {communities.length > 0 && (
        <section className={section}>
          <p className='label'>{viewerId ? 'COMUNIDADES PARA TI' : 'COMUNIDADES'}</p>
          <ul className='mt-2'>
            {communities.map((c) => (
              <li key={c.id} className='flex items-center gap-3 py-2'>
                <Link href={`/r/${c.name}`} className='min-w-0 flex-1'>
                  <span className='block truncate font-medium text-display'>r/{c.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {c._count.subscribers} {c._count.subscribers === 1 ? 'miembro' : 'miembros'}
                  </span>
                </Link>
                {viewerId && <SubscribeLeaveToggle compact isSubscribed={false} subredditId={c.id} subredditName={c.name} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href='/juegos/adivina-piloto' className={`${section} group flex items-center gap-4`}>
        <span className='display text-3xl leading-none text-display' aria-hidden='true'>
          ?
        </span>
        <span className='flex-1'>
          <span className='label block'>JUEGO DEL DÍA</span>
          <span className='text-display group-hover:underline group-hover:underline-offset-4'>Adivina el piloto</span>
        </span>
        <span aria-hidden='true' className='text-display'>
          →
        </span>
      </Link>

      <Link href='/r/create' className={`${section} flex items-center justify-between text-sm text-muted-foreground hover:text-display`}>
        Crear una comunidad <span aria-hidden='true'>+</span>
      </Link>
    </div>
  )
}

export default HomeRail
