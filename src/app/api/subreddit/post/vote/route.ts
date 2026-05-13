import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { PostVoteValidator } from '@/lib/validators/vote'
import { CachedPost } from '@/types/redis'
import { Post, User, VoteType } from '@prisma/client'
import { z } from 'zod'

const CACHE_AFTER_UPVOTES = 1

type PostForCache = Pick<Post, 'id' | 'title' | 'content' | 'createdAt'> & {
  author: Pick<User, 'username'>
}

async function recountAndCachePost(
  postId: string,
  post: PostForCache,
  currentVote: VoteType | null
) {
  const votes = await db.vote.findMany({ where: { postId } })
  const votesAmt = votes.reduce((acc, vote) => {
    if (vote.type === 'UP') return acc + 1
    if (vote.type === 'DOWN') return acc - 1
    return acc
  }, 0)

  if (votesAmt < CACHE_AFTER_UPVOTES) return

  const cachePayload: CachedPost = {
    authorUsername: post.author.username ?? '',
    content: JSON.stringify(post.content),
    id: post.id,
    title: post.title,
    currentVote,
    createdAt: post.createdAt,
  }
  await redis.hset(`post:${postId}`, cachePayload)
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { postId, voteType } = PostVoteValidator.parse(body)

    const session = await getAuthSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const existingVote = await db.vote.findFirst({
      where: { userId: session.user.id, postId },
    })

    const post = await db.post.findUnique({
      where: { id: postId },
      include: { author: true },
    })

    if (!post) {
      return new Response('Post not found', { status: 404 })
    }

    if (existingVote) {
      // same vote → toggle off
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: { userId_postId: { postId, userId: session.user.id } },
        })
        await recountAndCachePost(postId, post, null)
        return new Response('OK')
      }

      // different vote → flip
      await db.vote.update({
        where: { userId_postId: { postId, userId: session.user.id } },
        data: { type: voteType },
      })
      await recountAndCachePost(postId, post, voteType)
      return new Response('OK')
    }

    // no existing vote → create
    await db.vote.create({
      data: { type: voteType, userId: session.user.id, postId },
    })
    await recountAndCachePost(postId, post, voteType)
    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    return new Response(
      'Could not post to subreddit at this time. Please try later',
      { status: 500 }
    )
  }
}
