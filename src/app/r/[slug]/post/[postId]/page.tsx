import CommentsSection from '@/components/CommentsSection'
import EditorOutput from '@/components/EditorOutput'
import PostVoteServer from '@/components/post-vote/PostVoteServer'
import { db } from '@/lib/db'
import { postCacheKey, redis } from '@/lib/redis'
import { formatTimeToNow } from '@/lib/utils'
import { CachedPost } from '@/types/redis'
import { Post, User, Vote } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

interface SubRedditPostPageProps {
  params: Promise<{ postId: string }>
}

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  const { postId } = await params

  const cachedPost = (await redis.hgetall(
    postCacheKey(postId)
  )) as CachedPost

  let post: (Post & { votes: Vote[]; author: User }) | null = null

  if (!cachedPost) {
    post = await db.post.findFirst({
      where: {
        id: postId,
      },
      include: {
        votes: true,
        author: true,
      },
    })
  }

  if (!post && !cachedPost) return notFound()

  const author = post?.author.username ?? cachedPost.authorUsername

  return (
    <div className='space-y-4'>
      <article className='rounded-xl border border-border bg-card p-5 sm:p-6'>
        <p className='text-xs text-muted-foreground'>
          <Link className='hover:text-display hover:underline underline-offset-2' href={`/u/${author}`}>
            u/{author}
          </Link>
          <span className='px-1.5' aria-hidden='true'>·</span>
          {formatTimeToNow(new Date(post?.createdAt ?? cachedPost.createdAt))}
        </p>
        <h1 className='mt-3 text-2xl leading-snug text-display sm:text-3xl'>{post?.title ?? cachedPost.title}</h1>

        <div className='mt-4'>
          <EditorOutput content={post?.content ?? cachedPost.content} />
        </div>

        <div className='mt-6 flex items-center border-t border-border pt-4'>
          <Suspense fallback={<VoteShell />}>
            <PostVoteServer
              postId={post?.id ?? cachedPost.id}
              getData={async () => {
                return await db.post.findUnique({
                  where: {
                    id: postId,
                  },
                  include: {
                    votes: true,
                  },
                })
              }}
            />
          </Suspense>
        </div>
      </article>

      <section aria-labelledby='comments-title' className='rounded-xl border border-border bg-card p-5 sm:p-6'>
        <h2 id='comments-title' className='label'>COMENTARIOS</h2>
        <Suspense fallback={<Loader2 className='mt-6 h-5 w-5 animate-spin text-muted-foreground' />}>
          <CommentsSection postId={post?.id ?? cachedPost.id} />
        </Suspense>
      </section>
    </div>
  )
}

function VoteShell() {
  return (
    <div className='inline-flex h-9 w-28 items-center justify-center rounded-full border border-input' aria-hidden='true'>
      <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
    </div>
  )
}

export default SubRedditPostPage
