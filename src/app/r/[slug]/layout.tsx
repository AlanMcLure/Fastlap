import SubscribeLeaveToggle from '@/components/SubscribeLeaveToggle'
import BackButton from '@/components/BackButton'
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
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
        },
      },
    },
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
    <div>
      <BackButton className='-ml-5' />

      <div className='grid grid-cols-1 gap-y-6 py-6 md:grid-cols-3 md:gap-x-6'>
        <div className='flex flex-col space-y-4 md:col-span-2'>{children}</div>

        {/* info sidebar */}
        <aside className='order-first h-fit space-y-5 rounded-xl border border-border bg-card p-5 md:order-last'>
          <div>
            <p className='label'>SOBRE LA COMUNIDAD</p>
            <p className='mt-2 text-lg text-display'>r/{subreddit.name}</p>
          </div>

          <dl className='divide-y divide-border text-sm'>
            <div className='flex justify-between gap-x-4 py-3'>
              <dt className='label self-center'>CREADA</dt>
              <dd className='text-foreground'>
                <time dateTime={subreddit.createdAt.toISOString()}>
                  {format(subreddit.createdAt, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </time>
              </dd>
            </div>
            <div className='flex justify-between gap-x-4 py-3'>
              <dt className='label self-center'>MIEMBROS</dt>
              <dd className='font-mono text-display'>{memberCount}</dd>
            </div>
          </dl>

          {isCreator ? (
            <p className='label'>ERES EL CREADOR DE ESTA COMUNIDAD</p>
          ) : (
            <SubscribeLeaveToggle
              isSubscribed={isSubscribed}
              subredditId={subreddit.id}
              subredditName={subreddit.name}
            />
          )}
          <Link
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            href={`/r/${slug}/submit`}>
            Crear publicación
          </Link>
          <Link
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            href={`/r/${slug}/liga`}>
            Liga de pronósticos
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default Layout
