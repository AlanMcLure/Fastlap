import PostFeed from "@/components/PostFeed"
import { PAGINATION_RESULTS } from "@/config"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    slug: string
  }
}

const page = async ({ params }: PageProps) => {
  const { slug } = params

  const user = await db.user.findFirst({
    where: { username: slug },
  })

  if (!user) return notFound()

  const posts = await db.post.findMany({
    where: {
      authorId: user.id,
    },
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
  })

  if (!posts) return notFound()

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl h-14'>
        u/{user.username}
      </h1>
      <PostFeed initialPosts={posts} username={user.username || undefined} />
    </>
  )
}

export default page