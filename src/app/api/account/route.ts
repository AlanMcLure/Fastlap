import { z } from 'zod'

import { confirmationMatches, deletionBlocker } from '@/lib/accountRules'
import { deleteAccount } from '@/lib/accountDeletion'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { accountDeleteRatelimit } from '@/lib/ratelimit'

const Body = z.object({ confirm: z.string().max(64) })

/** Deletes the caller's own account. The client then signs out. */
export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const { success } = await accountDeleteRatelimit.limit(session.user.id)
    if (!success) return new Response('Too many requests', { status: 429 })

    const { confirm } = Body.parse(await req.json())

    // Trust the database, not the token: role and username may have changed since sign-in.
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, role: true },
    })
    if (!user) return new Response('Not found', { status: 404 })

    const blocker = deletionBlocker(user.role)
    if (blocker) return new Response(blocker, { status: 403 })
    if (!confirmationMatches(confirm, user.username)) {
      return new Response('Confirmation does not match', { status: 400 })
    }

    await deleteAccount(session.user.id)
    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) return new Response(error.message, { status: 400 })
    console.error('Account deletion failed:', error)
    return new Response('Could not delete the account at this time. Please try later', { status: 500 })
  }
}
