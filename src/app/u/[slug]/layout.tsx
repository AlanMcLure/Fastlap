import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

import { UserAvatar } from '@/components/UserAvatar'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

/** Profile header (who, since when, what they have done here) above the profile page. */
const UserLayout = async ({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) => {
  const { slug } = await params

  // only public fields: this header is shown to everyone
  const user = await db.user.findFirst({
    where: { username: slug },
    select: { id: true, username: true, image: true, createdAt: true },
  })
  if (!user) return notFound()

  const [posts, communities, session] = await Promise.all([
    db.post.count({ where: { authorId: user.id } }),
    db.subreddit.count({ where: { creatorId: user.id } }),
    getAuthSession(),
  ])
  const own = session?.user?.id === user.id

  const stat = (label: string, value: number) => (
    <div>
      <dt className='label'>{label}</dt>
      <dd className='mt-1 font-mono text-xl font-bold text-display'>{value}</dd>
    </div>
  )

  return (
    <div className='mx-auto max-w-3xl pb-10'>
      <header className='flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-border pb-6'>
        <UserAvatar user={{ name: user.username, image: user.image }} className='h-16 w-16' />
        <div className='min-w-0 flex-1'>
          <p className='label'>{own ? 'TU PERFIL' : 'PERFIL'}</p>
          <h1 className='mt-1 truncate text-3xl font-bold text-display'>u/{user.username}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            En FastLap desde{' '}
            <time dateTime={user.createdAt.toISOString()}>{format(user.createdAt, "MMMM 'de' yyyy", { locale: es })}</time>
          </p>
        </div>
        <dl className='flex gap-8'>
          {stat('PUBLICACIONES', posts)}
          {stat('COMUNIDADES', communities)}
        </dl>
      </header>
      {children}
    </div>
  )
}

export default UserLayout
