import MiniCreatePost from '@/components/MiniCreatePost'
import PostFeed from '@/components/PostFeed'
import { PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params

  const session = await getAuthSession()

  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
          comments: true,
          subreddit: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: PAGINATION_RESULTS,
      },
    },
  })

  if (!subreddit) return notFound()

  return (
    <>
      <div>
        <p className='label'>COMUNIDAD</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>r/{subreddit.name}</h1>
      </div>
      <MiniCreatePost session={session} />
      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  )
}

export default page
