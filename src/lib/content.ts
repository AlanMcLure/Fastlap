import 'server-only'

import { db } from '@/lib/db'
import { invalidatePostCache } from '@/lib/redis'

/** Deletes a post with its comments, and drops it from the hot-post cache. */
export async function deletePost(id: string) {
  // Replies point at each other (Restrict): detach them before the cascade removes the comments.
  await db.comment.updateMany({ where: { postId: id }, data: { replyToId: null } })
  await db.post.delete({ where: { id } })
  await invalidatePostCache(id)
}

/** Deletes a comment; its replies become top-level comments of the same post. */
export async function deleteComment(id: string) {
  await db.comment.updateMany({ where: { replyToId: id }, data: { replyToId: null } })
  await db.comment.delete({ where: { id } })
}
