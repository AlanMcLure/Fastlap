import Link from 'next/link'
import { notFound } from 'next/navigation'

import PostFeed from '@/components/PostFeed'
import { UserAvatar } from '@/components/UserAvatar'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getFeedPage } from '@/lib/feed'

interface PageProps {
  params: Promise<{ slug: string }>
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params

  const session = await getAuthSession()

  const subreddit = await db.subreddit.findFirst({ where: { name: slug }, select: { name: true } })
  if (!subreddit) return notFound()

  const viewerId = session?.user?.id
  const feed = await getFeedPage({ scope: { kind: 'community', name: subreddit.name }, viewerId })

  return (
    <div className='pb-10'>
      <p className='label'>COMUNIDAD</p>
      <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>r/{subreddit.name}</h1>

      <Link
        href={session?.user ? `/r/${subreddit.name}/submit` : '/sign-in'}
        className='mt-6 flex items-center gap-3 border-t border-border py-4 text-muted-foreground transition-colors hover:text-foreground'>
        <UserAvatar user={{ name: session?.user?.username ?? null, image: session?.user?.image ?? null }} className='h-9 w-9' />
        <span className='flex-1'>{session?.user ? `Publica algo en r/${subreddit.name}…` : 'Inicia sesión para publicar'}</span>
        {session?.user && <span className='rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>Publicar</span>}
      </Link>

      <PostFeed initialPage={feed} subredditName={subreddit.name} />
    </div>
  )
}

export default page
