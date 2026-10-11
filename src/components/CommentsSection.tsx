import Link from 'next/link'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { publicUserSelect } from '@/lib/feed'
import { sortComments, type CommentSort } from '@/lib/postPage'
import { cn } from '@/lib/utils'
import type { CommentVote, Prisma } from '@prisma/client'
import CreateComment from './CreateComment'
import MobileCommentBar from './comments/MobileCommentBar'
import PostComment from './comments/PostComment'

interface CommentsSectionProps {
  postId: string
  /** Author of the post: their comments get the AUTOR mark. */
  opId: string
  sort: CommentSort
  count: number
  /** Live race thread: say that the list refreshes itself. */
  live?: boolean
}

const commentSelect = {
  id: true,
  text: true,
  createdAt: true,
  authorId: true,
  replyToId: true,
  author: { select: publicUserSelect },
  votes: { select: { type: true, userId: true } },
} satisfies Prisma.CommentSelect

type LoadedComment = Prisma.CommentGetPayload<{ select: typeof commentSelect }>

/** Votes stay on the server: the client gets the score and the viewer's own vote, not who voted what. */
function toClient({ votes, ...comment }: LoadedComment, viewerId: string | undefined) {
  const score = votes.reduce((acc, vote) => acc + (vote.type === 'UP' ? 1 : -1), 0)
  const mine = votes.find((vote) => vote.userId === viewerId)
  const currentVote: Pick<CommentVote, 'type'> | undefined = mine ? { type: mine.type } : undefined
  return { comment, votesAmt: score, currentVote, score, createdAt: comment.createdAt }
}

/** The conversation under a post: count, composer, sort, and comments with their replies as a thread. */
const CommentsSection = async ({ postId, opId, sort, count, live = false }: CommentsSectionProps) => {
  const session = await getAuthSession()
  const viewerId = session?.user?.id

  const rows = await db.comment.findMany({
    where: { postId, replyToId: null }, // top-level comments; their replies come nested
    select: {
      ...commentSelect,
      replies: { select: commentSelect },
    },
  })
  const comments = sortComments(
    rows.map(({ replies, ...top }) => ({
      ...toClient(top, viewerId),
      // replies read as a conversation: oldest first
      replies: replies.map((reply) => toClient(reply, viewerId)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    })),
    sort
  )

  const sortLink = (value: CommentSort, label: string) => (
    <Link
      href={`?orden=${value === 'top' ? 'mejores' : 'nuevos'}#comentarios`}
      scroll={false}
      aria-current={sort === value ? 'true' : undefined}
      className={cn(
        'rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
        sort === value ? 'border-display text-display' : 'border-input text-muted-foreground hover:text-display'
      )}>
      {label}
    </Link>
  )

  return (
    <section id='comentarios' aria-labelledby='comentarios-titulo' className='mt-8 scroll-mt-28 border-t border-border pt-6'>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
        <h2 id='comentarios-titulo' className='label'>
          {count} {count === 1 ? 'COMENTARIO' : 'COMENTARIOS'}
        </h2>
        {live && <span className='label text-signal'>● SE ACTUALIZA SOLO</span>}
      </div>

      <div className='mt-4'>
        <CreateComment postId={postId} signedIn={Boolean(viewerId)} />
      </div>

      {comments.length > 1 && (
        <nav aria-label='Ordenar comentarios' className='mt-5 flex gap-2'>
          {sortLink('top', 'Mejores')}
          {sortLink('new', 'Nuevos')}
        </nav>
      )}

      {comments.length === 0 ? (
        <p className='py-10 text-center text-muted-foreground'>Todavía no hay comentarios. ¡Abre la conversación!</p>
      ) : (
        <ol className='mt-2'>
          {comments.map((top) => (
            <li key={top.comment.id} className='pt-5'>
              <PostComment
                comment={top.comment}
                currentVote={top.currentVote}
                votesAmt={top.votesAmt}
                postId={postId}
                isOp={top.comment.authorId === opId}
                hasReplies={top.replies.length > 0}>
                {top.replies.map((reply) => (
                  <PostComment
                    key={reply.comment.id}
                    size='sm'
                    comment={reply.comment}
                    currentVote={reply.currentVote}
                    votesAmt={reply.votesAmt}
                    postId={postId}
                    isOp={reply.comment.authorId === opId}
                  />
                ))}
              </PostComment>
            </li>
          ))}
        </ol>
      )}

      <MobileCommentBar />
    </section>
  )
}

export default CommentsSection
