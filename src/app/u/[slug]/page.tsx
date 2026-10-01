import PostFeed from "@/components/PostFeed"
import ProfilePredictions from "@/components/ProfilePredictions"
import { loadProfilePredictions } from "@/lib/predictionData"
import { PAGINATION_RESULTS } from "@/config"
import { db } from "@/lib/db"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const user = await db.user.findFirst({ where: { username: slug }, select: { username: true } })
  if (!user) return { title: 'Usuario no encontrado', robots: { index: false } }
  return {
    title: `u/${user.username}`,
    description: `Publicaciones de u/${user.username} en FastLap, la red social de la Fórmula 1.`,
    alternates: { canonical: `/u/${user.username}` },
  }
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params

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

  // Prediction stats are a bonus: a failure here must not take the profile down.
  const predictions = await loadProfilePredictions(user.id).catch((error) => {
    console.error('Profile predictions unavailable', error)
    return null
  })

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl h-14'>
        u/{user.username}
      </h1>
      {predictions && <ProfilePredictions data={predictions} />}
      <PostFeed initialPosts={posts} username={user.username || undefined} />
    </>
  )
}

export default page