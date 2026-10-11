import { getStoredReplay } from '@/lib/replay/replays'

export const dynamic = 'force-dynamic'

/** The stored replay of a race (JSON, built once after the race and never changed). 404 if not built. */
export async function GET(_req: Request, { params }: { params: Promise<{ season: string; round: string }> }) {
  const { season, round } = await params
  const s = Number(season)
  const r = Number(round)
  if (!Number.isInteger(s) || !Number.isInteger(r)) return new Response('Not found', { status: 404 })
  const replay = await getStoredReplay(s, r)
  if (!replay) return new Response('Not found', { status: 404 })
  return Response.json(replay, { headers: { 'Cache-Control': 'public, max-age=86400' } })
}
