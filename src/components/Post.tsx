'use client'

import { formatTimeToNow } from '@/lib/utils'
import { Post as PrismaPost, User, Vote } from '@prisma/client'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { FC, useRef } from 'react'
import EditorOutput from './EditorOutput'
import PostVoteClient from './post-vote/PostVoteClient'
import DeletePostButton from './DeletePostButton'
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

const Post: FC<PostProps> = ({
  post,
  votesAmt: _votesAmt,
  currentVote: _currentVote,
  subredditName,
  commentAmt,
}) => {
  const pRef = useRef<HTMLParagraphElement>(null)

  const queryClient = useQueryClient();

  const invalidatePostsCache = () => {
    queryClient.invalidateQueries(['posts']); // Invalidar la caché de los posts
  };

  return (
    <div className='rounded-md bg-white shadow'>
      <div className='px-6 py-4 flex justify-between'>
        <PostVoteClient
          postId={post.id}
          initialVotesAmt={_votesAmt}
          initialVote={_currentVote?.type}
        />

        <div className='w-0 flex-1'>
          <div className='max-h-40 mt-1 text-xs text-gray-500'>
            {subredditName ? (
              <>
                <Link
                  className='underline text-zinc-900 text-sm underline-offset-2'
                  href={`/r/${subredditName}`}>
                  r/{subredditName}
                </Link>
                <span className='px-1'>•</span>
              </>
            ) : null}
            <span>Publicado por <Link
              className='hover:underline text-zinc-900 text-xs underline-offset-2'
              href={`/u/${post.author.username}`}>
              u/{post.author.username}
            </Link>
            </span>{' '}
            {formatTimeToNow(new Date(post.createdAt))}
          </div>
          <Link href={`/r/${subredditName}/post/${post.id}`}>
            <h1 className='text-lg font-semibold py-2 leading-6 text-gray-900'>
              {post.title}
            </h1>
          </Link>

          <div
            className='relative text-sm max-h-40 w-full overflow-clip'
            ref={pRef}>
            <EditorOutput content={post.content} />
            {pRef.current?.clientHeight === 160 ? (
              // blur bottom if content is too long
              <div className='absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white to-transparent'></div>
            ) : null}
          </div>
        </div>
      </div>

      <div className='bg-gray-50 z-20 text-sm px-4 py-4 sm:px-6 flex justify-between'>
        <Link
          href={`/r/${subredditName}/post/${post.id}`}
          className='w-fit flex items-center gap-2'>
          <MessageSquare className='h-4 w-4' /> {commentAmt} comentarios
        </Link>
        <DeletePostButton postId={post.id} authorId={post.authorId} invalidatePostsCache={invalidatePostsCache} />
      </div>
    </div>
  )
}
export default Post
