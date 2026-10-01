'use client'

import { formatTimeToNow } from '@/lib/utils'
import { postPreview } from '@/lib/postPreview'
import { Post as PrismaPost, User, Vote } from '@prisma/client'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { FC, useMemo } from 'react'
import PostVoteClient from './post-vote/PostVoteClient'
import DeletePostButton from './DeletePostButton'
import ReportPostMenu from './ReportPostMenu'
import { useQueryClient } from '@tanstack/react-query'

type PartialVote = Pick<Vote, 'type'>

interface PostProps {
  post: PrismaPost & {
    author: User
    votes: Vote[]
  }
  votesAmt: number
  subredditName: string
  currentVote?: PartialVote
  commentAmt: number
}

/** A post in a feed: where and who, title, the start of the text or first image, votes and comments. */
const Post: FC<PostProps> = ({
  post,
  votesAmt: _votesAmt,
  currentVote: _currentVote,
  subredditName,
  commentAmt,
}) => {
  const queryClient = useQueryClient()
  const preview = useMemo(() => postPreview(post.content), [post.content])
  const href = `/r/${subredditName}/post/${post.id}`

  const invalidatePostsCache = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  return (
    <article className='rounded-xl border border-border bg-card transition-colors hover:border-input'>
      <div className='p-5'>
        <div className='flex items-start justify-between gap-3'>
          <p className='min-w-0 text-xs text-muted-foreground'>
            {subredditName ? (
              <>
                <Link className='font-medium text-display hover:underline underline-offset-2' href={`/r/${subredditName}`}>
                  r/{subredditName}
                </Link>
                <span className='px-1.5' aria-hidden='true'>·</span>
              </>
            ) : null}
            <Link className='hover:text-display hover:underline underline-offset-2' href={`/u/${post.author.username}`}>
              u/{post.author.username}
            </Link>
            <span className='px-1.5' aria-hidden='true'>·</span>
            {formatTimeToNow(new Date(post.createdAt))}
          </p>
          <DeletePostButton postId={post.id} authorId={post.authorId} invalidatePostsCache={invalidatePostsCache} />
          <ReportPostMenu postId={post.id} authorId={post.authorId} />
        </div>

        <Link href={href} className='mt-3 block'>
          <h2 className='text-xl leading-snug text-display'>{post.title}</h2>
          {preview.text && <p className='mt-2 line-clamp-3 text-muted-foreground'>{preview.text}</p>}
        </Link>

        {preview.imageUrl && (
          <Link href={href} className='mt-4 block' tabIndex={-1} aria-hidden='true'>
            {/* user-uploaded image from any allowed host: a plain <img> avoids next/image domain restrictions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.imageUrl}
              alt={preview.imageAlt ?? ''}
              loading='lazy'
              referrerPolicy='no-referrer'
              className='max-h-72 w-full rounded-lg border border-border object-cover'
            />
          </Link>
        )}
      </div>

      <div className='flex items-center gap-2 border-t border-border px-4 py-3 sm:px-5'>
        <PostVoteClient postId={post.id} initialVotesAmt={_votesAmt} initialVote={_currentVote?.type} />
        <Link
          href={href}
          className='inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-display'>
          <MessageSquare className='h-4 w-4' aria-hidden='true' />
          {commentAmt} {commentAmt === 1 ? 'comentario' : 'comentarios'}
        </Link>
      </div>
    </article>
  )
}
export default Post
