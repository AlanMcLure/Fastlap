'use client'

import { useOnClickOutside } from '@/hooks/use-on-click-outside'
import { formatTimeToNow } from '@/lib/utils'
import { CommentRequest } from '@/lib/validators/comment'
import type { Comment, CommentVote } from '@prisma/client'
import type { PublicUser } from '@/lib/feed'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, ReactNode, useRef, useState } from 'react'
import CommentVotes from '../CommentVotes'
import { UserAvatar } from '../UserAvatar'
import { Button } from '../ui/Button'
import { toast } from '../../hooks/use-toast'
import { useSession } from 'next-auth/react'
import DeleteCommentButton from '../DeleteCommentButton'
import ReportCommentButton from '../ReportCommentButton'

type ExtendedComment = Pick<Comment, 'id' | 'text' | 'createdAt' | 'authorId' | 'replyToId'> & {
  author: PublicUser
}

interface PostCommentProps {
  comment: ExtendedComment
  votesAmt: number
  currentVote: Pick<CommentVote, 'type'> | undefined
  postId: string
  /** Written by the author of the post (shows the AUTOR mark). */
  isOp?: boolean
  /** Draws the thread line from the avatar down to the replies. */
  hasReplies?: boolean
  /** `sm` for replies. */
  size?: 'md' | 'sm'
  /** The replies, rendered inside the thread. */
  children?: ReactNode
}

const PostComment: FC<PostCommentProps> = ({
  comment,
  votesAmt,
  currentVote,
  postId,
  isOp = false,
  hasReplies = false,
  size = 'md',
  children,
}) => {
  const { data: session } = useSession()
  const [isReplying, setIsReplying] = useState<boolean>(false)
  const commentRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState<string>(`@${comment.author.username} `)
  const router = useRouter()
  useOnClickOutside(commentRef, () => {
    setIsReplying(false)
  })

  const { mutate: postComment, isPending: isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      const payload: CommentRequest = { postId, text, replyToId }

      const { data } = await axios.patch(
        `/api/subreddit/post/comment/`,
        payload
      )
      return data
    },

    onError: () => {
      return toast({
        title: 'Algo fue mal',
        description: "El comentario no se ha creado correctamente. Por favor, inténtalo de nuevo.",
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      router.refresh()
      setIsReplying(false)
    },
  })

  const replyId = `respuesta-${comment.id}`

  return (
    <div className='flex gap-3'>
      <div className='flex shrink-0 flex-col items-center'>
        <UserAvatar
          user={{ name: comment.author.username, image: comment.author.image }}
          className={size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'}
        />
        {hasReplies && <span className='mt-1.5 w-0.5 flex-1 rounded-full bg-border' aria-hidden='true' />}
      </div>

      <div className='min-w-0 flex-1'>
        <div ref={commentRef}>
          <p className='flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted-foreground'>
            <Link href={`/u/${comment.author.username}`} className='font-bold text-display underline-offset-2 hover:underline'>
              {comment.author.username}
            </Link>
            {isOp && (
              <span className='rounded border border-input px-1.5 py-0.5 font-mono text-[9px] leading-none tracking-[0.1em] text-foreground'>
                AUTOR
              </span>
            )}
            <span aria-hidden='true'>·</span>
            <time dateTime={new Date(comment.createdAt).toISOString()}>{formatTimeToNow(new Date(comment.createdAt))}</time>
          </p>

          <p className='mt-1 whitespace-pre-wrap break-words leading-relaxed text-foreground'>{comment.text}</p>

          <div className='-ml-1 mt-1.5 flex items-center gap-1'>
            <CommentVotes commentId={comment.id} votesAmt={votesAmt} currentVote={currentVote} />
            <Button
              onClick={() => {
                if (!session) return router.push('/sign-in')
                setIsReplying(true)
              }}
              variant='ghost'
              size='xs'
              className='rounded-full text-muted-foreground'>
              <MessageSquare className='mr-1.5 h-4 w-4' aria-hidden='true' />
              Responder
            </Button>
            <div className='ml-auto flex items-center'>
              <ReportCommentButton commentId={comment.id} authorId={comment.authorId} />
              <DeleteCommentButton commentId={comment.id} authorId={comment.authorId} />
            </div>
          </div>

          {isReplying && (
            <div className='mt-2 rounded-2xl border border-input px-4 py-3 focus-within:border-display'>
              <label htmlFor={replyId} className='sr-only'>
                Tu respuesta a {comment.author.username}
              </label>
              <textarea
                id={replyId}
                onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder='¿Qué piensas?'
                className='w-full resize-none bg-transparent leading-6 text-foreground outline-none placeholder:text-muted-foreground [field-sizing:content]'
              />
              <div className='mt-2 flex justify-end gap-2'>
                <Button size='sm' variant='ghost' className='rounded-full' onClick={() => setIsReplying(false)}>
                  Cancelar
                </Button>
                <Button
                  size='sm'
                  className='rounded-full'
                  isLoading={isLoading}
                  disabled={input.trim().length === 0}
                  onClick={() =>
                    postComment({
                      postId,
                      text: input,
                      replyToId: comment.replyToId ?? comment.id, // replies stay one level deep
                    })
                  }>
                  Responder
                </Button>
              </div>
            </div>
          )}
        </div>

        {children && <div className='mt-1 space-y-4 pt-2'>{children}</div>}
      </div>
    </div>
  )
}

export default PostComment
