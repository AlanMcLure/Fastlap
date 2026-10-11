import AutoRefresh from '@/components/AutoRefresh'
import CommentsSection from '@/components/CommentsSection'
import EditorOutput from '@/components/EditorOutput'
import JsonLd from '@/components/JsonLd'
import ReportPostMenu from '@/components/ReportPostMenu'
import ShareButton from '@/components/ShareButton'
import PostVoteServer from '@/components/post-vote/PostVoteServer'
import RaceWeekendPanel from '@/components/race-hub/RaceWeekendPanel'
import { db } from '@/lib/db'
import { getCalendar } from '@/lib/f1/queries'
import { parseCommentSort } from '@/lib/postPage'
import { postPreview } from '@/lib/postPreview'
import { canCreateRaceThread } from '@/lib/raceHub'
import { absoluteUrl, DESCRIPTION_MAX, truncate } from '@/lib/seo'
import { withTimeout } from '@/lib/timeout'
import { cn, formatTimeToNow } from '@/lib/utils'
import { Loader2, MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

interface SubRedditPostPageProps {
  params: Promise<{ postId: string }>
  searchParams: Promise<{ orden?: string }>
}

/** Author of the automatic Grand Prix threads (see src/lib/raceThread.ts). */
const SYSTEM_USERNAME = 'fastlap'

/** A race thread refreshes itself while its weekend is on (and up to a week after the race). */
async function isLiveWeekend(season: number, round: number) {
  try {
    const race = (await withTimeout(getCalendar(season), 3000)).find((r) => r.round === round)
    return race ? canCreateRaceThread(race) : false
  } catch {
    return false
  }
}

const getPostMeta = (postId: string) =>
  db.post.findUnique({
    where: { id: postId },
    select: {
      id: true, title: true, content: true, createdAt: true, updatedAt: true, authorId: true,
      author: { select: { username: true } },
      subreddit: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  })

export async function generateMetadata({ params }: SubRedditPostPageProps): Promise<Metadata> {
  const { postId } = await params
  const post = await getPostMeta(postId)
  if (!post) return { title: 'Publicación no encontrada', robots: { index: false } }

  const preview = postPreview(post.content, DESCRIPTION_MAX)
  const description = truncate(preview.text || `Publicación de u/${post.author.username} en r/${post.subreddit.name}`, DESCRIPTION_MAX)
  const path = `/r/${post.subreddit.name}/post/${post.id}`
  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: path,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      // The first https image of the post when there is one; otherwise the generated card (opengraph-image).
      ...(preview.imageUrl ? { images: [{ url: preview.imageUrl, alt: preview.imageAlt }] } : {}),
    },
  }
}

const SubRedditPostPage = async ({ params, searchParams }: SubRedditPostPageProps) => {
  const { postId } = await params
  const { orden } = await searchParams

  const post = await db.post.findUnique({
    where: { id: postId },
    include: { author: { select: { username: true } }, raceWeekend: { select: { season: true, round: true } } },
  })
  if (!post) return notFound()

  const author = post.author.username
  const meta = await getPostMeta(postId)
  const community = meta?.subreddit.name ?? ''
  const commentCount = meta?._count.comments ?? 0
  const weekend = post.raceWeekend
  const official = author === SYSTEM_USERNAME
  const sort = parseCommentSort(orden, Boolean(weekend))
  const live = weekend ? await isLiveWeekend(weekend.season, weekend.round) : false
  const path = `/r/${community}/post/${post.id}`

  return (
    <div className='pb-10'>
      {meta && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: meta.title,
            url: absoluteUrl(path),
            datePublished: meta.createdAt.toISOString(),
            dateModified: meta.updatedAt.toISOString(),
            author: { '@type': 'Person', name: `u/${author}`, url: absoluteUrl(`/u/${author}`) },
            commentCount,
            isPartOf: { '@type': 'WebPage', name: `r/${community}`, url: absoluteUrl(`/r/${community}`) },
          }}
        />
      )}
      {live && <AutoRefresh seconds={30} />}

      <Link href={`/r/${community}`} className='label inline-flex h-9 items-center gap-2 hover:text-display'>
        <span aria-hidden='true'>←</span> R/{community}
      </Link>

      <article className='mt-2 flex'>
        <div className={cn('mb-4 mt-1.5 w-1 shrink-0 rounded-full', official ? 'bg-signal' : 'bg-input')} aria-hidden='true' />
        <div className='w-12 shrink-0 sm:w-16'>
          <Suspense fallback={<VoteShell />}>
            <PostVoteServer
              layout='column'
              postId={post.id}
              getData={() => db.post.findUnique({ where: { id: postId }, select: { votes: { select: { type: true, userId: true } } } })}
            />
          </Suspense>
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <p className='flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted-foreground'>
              <Link className='font-bold text-display underline-offset-2 hover:underline' href={`/u/${author}`}>
                {author}
              </Link>
              {official && (
                <span className='rounded bg-signal px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none tracking-[0.1em] text-black'>
                  OFICIAL
                </span>
              )}
              <span aria-hidden='true'>·</span>
              <Link className='underline-offset-2 hover:text-display hover:underline' href={`/r/${community}`}>
                r/{community}
              </Link>
              <span aria-hidden='true'>·</span>
              <time dateTime={post.createdAt.toISOString()}>{formatTimeToNow(post.createdAt)}</time>
            </p>
            <ReportPostMenu postId={post.id} authorId={post.authorId} />
          </div>

          <h1 className='mt-3 text-2xl font-bold leading-tight text-display sm:text-3xl'>{post.title}</h1>
          <div className='mt-4'>
            <EditorOutput content={post.content} />
          </div>

          <div className='-ml-3 mt-2 flex items-center gap-1'>
            <a href='#comentarios' className='inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-display'>
              <MessageSquare className='h-4 w-4' aria-hidden='true' />
              {commentCount} {commentCount === 1 ? 'comentario' : 'comentarios'}
            </a>
            <ShareButton title={post.title} path={path} />
          </div>
        </div>
      </article>

      {weekend && (
        <div className='mt-6 sm:ml-[68px]'>
          <Suspense fallback={null}>
            <RaceWeekendPanel season={weekend.season} round={weekend.round} />
          </Suspense>
        </div>
      )}

      <Suspense fallback={<Loader2 className='mt-8 h-5 w-5 animate-spin text-muted-foreground' />}>
        <CommentsSection postId={post.id} opId={post.authorId} sort={sort} count={commentCount} live={live} />
      </Suspense>
    </div>
  )
}

function VoteShell() {
  return (
    <div className='flex h-[86px] items-center justify-center' aria-hidden='true'>
      <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
    </div>
  )
}

export default SubRedditPostPage
