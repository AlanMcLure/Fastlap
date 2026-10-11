'use client'

import { useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Share2 } from 'lucide-react'
import Link from 'next/link'
import { FC, useMemo } from 'react'

import type { FeedPost } from '@/lib/feed'
import { postPreview } from '@/lib/postPreview'
import { shareLink } from '@/lib/share'
import { cn, formatTimeToNow } from '@/lib/utils'
import DeletePostButton from './DeletePostButton'
import PostVoteClient from './post-vote/PostVoteClient'
import ReportPostMenu from './ReportPostMenu'

/** Author of the automatic Grand Prix threads (see src/lib/raceThread.ts). */
const SYSTEM_USERNAME = 'fastlap'

interface PostProps {
  post: FeedPost
}

const action =
  'inline-flex h-9 items-center gap-2 rounded-full px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * A post in a feed, drawn like a row of a timing tower: a thin stripe (red for official threads),
 * the score in big dot-matrix digits in the left gutter, then who / where / when, title, preview
 * and actions. Rows are separated by lines, not boxed in cards.
 */
const Post: FC<PostProps> = ({ post }) => {
  const queryClient = useQueryClient()
  const preview = useMemo(() => postPreview(post.content), [post.content])
  const community = post.subreddit.name
  const href = `/r/${community}/post/${post.id}`
  const official = post.author.username === SYSTEM_USERNAME

  return (
    <article className='flex border-b border-border'>
      <div className={cn('my-4 w-1 shrink-0 rounded-full', official ? 'bg-signal' : 'bg-input')} aria-hidden='true' />

      <div className='w-12 shrink-0 pt-2.5 sm:w-14'>
        <PostVoteClient layout='column' postId={post.id} initialVotesAmt={post.votesAmt} initialVote={post.currentVote} />
      </div>

      <div className='min-w-0 flex-1 py-3.5 pr-1'>
        <div className='flex items-start justify-between gap-3'>
          <p className='flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted-foreground'>
            <Link className='font-bold text-display underline-offset-2 hover:underline' href={`/u/${post.author.username}`}>
              {post.author.username}
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
            <time dateTime={new Date(post.createdAt).toISOString()}>{formatTimeToNow(new Date(post.createdAt))}</time>
          </p>
          <div className='-mt-1 flex shrink-0 items-center'>
            <DeletePostButton
              postId={post.id}
              authorId={post.authorId}
              invalidatePostsCache={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
            />
            <ReportPostMenu postId={post.id} authorId={post.authorId} />
          </div>
        </div>

        <Link href={href} className='mt-1.5 block'>
          <h2 className='text-lg font-medium leading-snug text-display'>{post.title}</h2>
          {preview.text && <p className='mt-1 line-clamp-3 leading-relaxed text-muted-foreground'>{preview.text}</p>}
        </Link>

        {/* the image box is reserved before it loads (no layout shift) and never taller than 240 px */}
        {preview.imageUrl && (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden='true'
            className='mt-3 block aspect-video max-h-60 w-full max-w-lg overflow-hidden rounded-xl border border-input bg-muted'>
            {/* user-uploaded image from any allowed host: a plain <img> avoids next/image domain restrictions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.imageUrl} alt={preview.imageAlt ?? ''} loading='lazy' referrerPolicy='no-referrer' className='h-full w-full object-cover' />
          </Link>
        )}

        <div className='-ml-2.5 mt-1.5 flex items-center gap-1'>
          <Link href={href} className={action}>
            <MessageSquare className='h-4 w-4' aria-hidden='true' />
            {post.commentAmt} <span className='sr-only sm:not-sr-only'>{post.commentAmt === 1 ? 'comentario' : 'comentarios'}</span>
          </Link>
          <button type='button' className={action} onClick={() => shareLink(post.title, href)}>
            <Share2 className='h-4 w-4' aria-hidden='true' />
            <span className='sr-only sm:not-sr-only'>Compartir</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default Post
