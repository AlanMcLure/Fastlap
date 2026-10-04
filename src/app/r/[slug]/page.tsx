import MiniCreatePost from '@/components/MiniCreatePost'
import PostFeed from '@/components/PostFeed'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getFeedPage } from '@/lib/feed'
import { notFound } from 'next/navigation'

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
    <>
      <div>
        <p className='label'>COMUNIDAD</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>r/{subreddit.name}</h1>
      </div>
      <MiniCreatePost session={session} />
      <PostFeed initialPage={feed} subredditName={subreddit.name} />
    </>
  )
}

export default page
