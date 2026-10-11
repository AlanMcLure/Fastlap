import SubscribeLeaveToggle from '@/components/SubscribeLeaveToggle'
import { buttonVariants } from '@/components/ui/Button'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const community = await db.subreddit.findFirst({
    where: { name: slug },
    select: { name: true, _count: { select: { posts: true, subscribers: true } } },
  })
  if (!community) return { title: 'Comunidad no encontrada', robots: { index: false } }

  const { posts, subscribers } = community._count
  const description = `r/${community.name}, comunidad de FastLap para aficionados de la Fórmula 1: ${posts} ${posts === 1 ? 'publicación' : 'publicaciones'} y ${subscribers} ${subscribers === 1 ? 'miembro' : 'miembros'}.`
  return {
    title: `r/${community.name}`,
    description,
    alternates: { canonical: `/r/${community.name}` },
    openGraph: { title: `r/${community.name} · FastLap`, description, url: `/r/${community.name}` },
  }
}

const Layout = async ({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const session = await getAuthSession()

  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
  })

  const subscription = !session?.user
    ? undefined
    : await db.subscription.findFirst({
      where: {
        subreddit: {
          name: slug,
        },
        user: {
          id: session.user.id,
        },
      },
    })

  const isSubscribed = !!subscription

  if (!subreddit) return notFound()

  const memberCount = await db.subscription.count({
    where: {
      subreddit: {
        name: slug,
      },
    },
  })

  const isCreator = subreddit.creatorId === session?.user?.id

  return (
    <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
      <div className='min-w-0 flex-1'>{children}</div>

      {/* about the community: no box, sections divided by lines */}
      <aside aria-label='Sobre la comunidad' className='w-full shrink-0 lg:sticky lg:top-[7.5rem] lg:w-80'>
        <section className='border-b border-border pb-5'>
          <p className='label'>COMUNIDAD</p>
          <Link href={`/r/${subreddit.name}`} className='mt-2 block text-xl font-bold text-display underline-offset-4 hover:underline'>
            r/{subreddit.name}
          </Link>
          <dl className='mt-4 grid grid-cols-2 gap-3'>
            <div>
              <dt className='label'>MIEMBROS</dt>
              <dd className='display mt-1 text-2xl leading-none text-display'>{memberCount}</dd>
            </div>
            <div>
              <dt className='label'>CREADA</dt>
              <dd className='mt-1.5 text-sm text-display'>
                <time dateTime={subreddit.createdAt.toISOString()}>
                  {format(subreddit.createdAt, "d MMM yyyy", { locale: es })}
                </time>
              </dd>
            </div>
          </dl>
          <div className='mt-4 flex gap-2'>
            {isCreator ? (
              <p className='label flex-1 self-center'>ERES SU CREADOR</p>
            ) : (
              <div className='flex-1'>
                <SubscribeLeaveToggle isSubscribed={isSubscribed} subredditId={subreddit.id} subredditName={subreddit.name} />
              </div>
            )}
            <Link className={buttonVariants({ variant: 'outline', className: 'flex-1 rounded-full' })} href={`/r/${slug}/submit`}>
              Publicar aquí
            </Link>
          </div>
        </section>
        <Link
          href={`/r/${slug}/liga`}
          className='flex items-center justify-between border-b border-border py-4 transition-colors hover:text-display'>
          <span>
            <span className='label block'>LIGA DE PRONÓSTICOS</span>
            <span className='text-display'>Podios de cada GP</span>
          </span>
          <span aria-hidden='true'>→</span>
        </Link>
      </aside>
    </div>
  )
}

export default Layout
