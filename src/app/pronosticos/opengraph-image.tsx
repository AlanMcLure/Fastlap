import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'
import { loadGlobalBoard } from '@/lib/predictionData'
import { leaderboardRows } from '@/lib/shareCards'
import { withTimeout } from '@/lib/timeout'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Clasificación global de pronósticos de FastLap'
export const dynamic = 'force-dynamic'

/** Share card of the global prediction ranking of the current season. */
export default async function Image() {
  const season = new Date().getUTCFullYear()
  let rows: ReturnType<typeof leaderboardRows> = []
  try {
    const { board, names } = await withTimeout(loadGlobalBoard(season), 4000)
    rows = leaderboardRows(board.filter((e) => e.scored > 0), new Map([...names].map(([id, n]) => [id, `u/${n}`])))
  } catch {
    // the card still renders without data
  }
  return ogImage({
    kicker: `Pronósticos · temporada ${season}`,
    title: 'Clasificación global',
    rows,
    note: rows.length === 0 ? 'Pronostica el podio de cada Gran Premio y compite con la comunidad' : undefined,
  })
}
