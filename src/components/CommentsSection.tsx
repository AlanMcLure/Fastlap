import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { publicUserSelect } from '@/lib/feed'
import type { CommentVote, Prisma } from '@prisma/client'
import CreateComment from './CreateComment'
import PostComment from './comments/PostComment'

interface CommentsSectionProps {
  postId: string
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
  const votesAmt = votes.reduce((acc, vote) => acc + (vote.type === 'UP' ? 1 : -1), 0)
  const mine = votes.find((vote) => vote.userId === viewerId)
  const currentVote: Pick<CommentVote, 'type'> | undefined = mine ? { type: mine.type } : undefined
  return { comment, votesAmt, currentVote, score: votesAmt }
}

const CommentsSection = async ({ postId }: CommentsSectionProps) => {
  const session = await getAuthSession()
  const viewerId = session?.user?.id

  const rows = await db.comment.findMany({
    where: { postId, replyToId: null }, // top-level comments; their replies come nested
    orderBy: { createdAt: 'asc' },
    select: {
      ...commentSelect,
      replies: { select: commentSelect, orderBy: { createdAt: 'asc' } },
    },
  })
  const comments = rows.map(({ replies, ...top }) => ({
    ...toClient(top, viewerId),
    // most liked replies first
    replies: replies.map((reply) => toClient(reply, viewerId)).sort((a, b) => b.score - a.score),
  }))

  return (
    <div className='mt-4 flex flex-col gap-y-6'>
      <CreateComment postId={postId} />

      {comments.length === 0 && (
        <p className='border-t border-border pt-6 text-sm text-muted-foreground'>Todavía no hay comentarios. ¡Sé el primero!</p>
      )}

      <div className='flex flex-col gap-y-6 border-t border-border pt-6'>
        {comments.map((top) => (
          <div key={top.comment.id} className='flex flex-col'>
            <div className='mb-2'>
              <PostComment comment={top.comment} currentVote={top.currentVote} votesAmt={top.votesAmt} postId={postId} />
            </div>

            {top.replies.map((reply) => (
              <div key={reply.comment.id} className='ml-3 border-l border-input py-2 pl-4'>
                <PostComment comment={reply.comment} currentVote={reply.currentVote} votesAmt={reply.votesAmt} postId={postId} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommentsSection
