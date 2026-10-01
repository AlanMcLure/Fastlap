import { db } from '@/lib/db'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Comunidad de FastLap'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const community = await db.subreddit.findFirst({ where: { name: slug }, select: { name: true } })
  return ogImage({ kicker: 'Comunidad', title: `r/${community?.name ?? slug}` })
}
