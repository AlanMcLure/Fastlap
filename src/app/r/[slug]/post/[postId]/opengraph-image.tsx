import { db } from '@/lib/db'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Publicación de FastLap'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ slug: string; postId: string }> }) {
  const { postId } = await params
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { title: true, subreddit: { select: { name: true } }, author: { select: { username: true } } },
  })
  return ogImage({
    kicker: post ? `r/${post.subreddit.name}` : 'FastLap',
    title: post?.title ?? 'Publicación no encontrada',
    footer: post?.author.username ? `u/${post.author.username}` : undefined,
  })
}
