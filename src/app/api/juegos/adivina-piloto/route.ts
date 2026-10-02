import { z } from 'zod'

import { dateKeyMadrid, feedbackFor, isSolved, MAX_ATTEMPTS, pickDaily } from '@/lib/games/driverGuess'
import { loadGamePool } from '@/lib/games/driverGuessData'
import { gameRatelimit } from '@/lib/ratelimit'
import { withTimeout } from '@/lib/timeout'

const Body = z.object({
  driverId: z.string().min(1).max(64),
  /** Day the client believes it is playing, so a game left open past midnight is refused. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attempt: z.number().int().min(1).max(MAX_ATTEMPTS),
})

/**
 * One guess of the daily game. Public (no account). The secret driver never leaves the server
 * except once the game is over (solved, or the last attempt was used). The attempt number comes
 * from the client: it is a game for fun, with no prizes or ranking, so it is not worth protecting.
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    // If Redis is down or slow the game keeps working: a rate limit must not take a free game offline.
    const limited = await withTimeout(gameRatelimit.limit(ip), 800).then((r) => !r.success, () => false)
    if (limited) return new Response('Too many requests', { status: 429 })

    const { driverId, date, attempt } = Body.parse(await req.json())

    const now = new Date()
    if (date !== dateKeyMadrid(now)) return new Response('Day changed', { status: 409 })

    const loaded = await loadGamePool(now)
    if (!loaded) return new Response('F1 data unavailable', { status: 503 })

    const answer = pickDaily(loaded.pool, date)
    const guess = loaded.pool.find((d) => d.id === driverId)
    if (!answer || !guess) return new Response('Unknown driver', { status: 404 })

    const feedback = feedbackFor(guess, answer, now)
    const solved = isSolved(feedback, guess, answer)
    const over = solved || attempt >= MAX_ATTEMPTS

    return Response.json({ guess, feedback, solved, answer: over ? answer : null })
  } catch (error) {
    if (error instanceof z.ZodError) return new Response(error.message, { status: 400 })
    console.error('Daily driver game failed:', error)
    return new Response('Could not play at this time. Please try later', { status: 500 })
  }
}
