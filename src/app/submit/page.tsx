import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Publicar', robots: { index: false } }

/** A list of communities, each linking to its post editor. */
const Group = ({ title, names }: { title: string; names: string[] }) =>
  names.length === 0 ? null : (
    <section className='space-y-2'>
      <h2 className='label'>{title}</h2>
      <ul className='divide-y divide-border border-y border-border'>
        {names.map((name) => (
          <li key={name}>
            <Link
              href={`/r/${name}/submit`}
              className='flex items-center justify-between py-3 text-display transition-colors hover:text-foreground'>
              r/{name}
              <span aria-hidden='true'>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )

/** "Publicar" from anywhere: pick the community first (followed ones on top), then its editor. */
export default async function SubmitPage() {
  const session = await getAuthSession()
  if (!session?.user) redirect('/sign-in')

  const [followed, popular] = await Promise.all([
    db.subreddit.findMany({
      where: { subscribers: { some: { userId: session.user.id } } },
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
    db.subreddit.findMany({
      where: { subscribers: { none: { userId: session.user.id } } },
      select: { name: true, _count: { select: { subscribers: true } } },
      orderBy: { subscribers: { _count: 'desc' } },
      take: 12,
    }),
  ])

  return (
    <div className='mx-auto max-w-xl space-y-8 py-6'>
      <div>
        <p className='label'>PUBLICAR</p>
        <h1 className='mt-2 text-3xl font-bold text-display'>¿En qué comunidad?</h1>
      </div>
      <Group title='TUS COMUNIDADES' names={followed.map((s) => s.name)} />
      <Group title='OTRAS COMUNIDADES' names={popular.map((s) => s.name)} />
      <p className='text-sm text-muted-foreground'>
        ¿No encuentras la tuya?{' '}
        <Link href='/r/create' className='text-display underline underline-offset-2'>
          Crea una comunidad
        </Link>
        .
      </p>
    </div>
  )
}
