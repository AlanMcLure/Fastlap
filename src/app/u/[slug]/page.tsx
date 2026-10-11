import PostFeed from "@/components/PostFeed"
import ProfilePredictions from "@/components/ProfilePredictions"
import { loadProfilePredictions } from "@/lib/predictionData"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { getFeedPage } from "@/lib/feed"
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
    select: { id: true, username: true },
  })

  if (!user?.username) return notFound()

  const session = await getAuthSession()
  const viewerId = session?.user?.id
  const feed = await getFeedPage({ scope: { kind: 'user', username: user.username }, viewerId })

  // Prediction stats are a bonus: a failure here must not take the profile down.
  const predictions = await loadProfilePredictions(user.id).catch((error) => {
    console.error('Profile predictions unavailable', error)
    return null
  })

  return (
    <div className='space-y-10 pt-6'>
      {predictions && <ProfilePredictions data={predictions} username={user.username ?? slug} />}
      <section aria-labelledby='posts-title'>
        <h2 id='posts-title' className='label mb-3'>
          PUBLICACIONES
        </h2>
        <PostFeed initialPage={feed} username={user.username} />
      </section>
    </div>
  )
}

export default page