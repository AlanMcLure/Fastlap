import { getCalendar, getRaceResults } from '@/lib/f1/queries'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'
import { podiumRows } from '@/lib/shareCards'
import { withTimeout } from '@/lib/timeout'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Fin de semana de carrera en FastLap'
export const dynamic = 'force-dynamic'

const DATA_TIMEOUT_MS = 3000

/** Share card of a race weekend: the podium and fastest lap once the race has results, otherwise the circuit. */
export default async function Image({ params }: { params: Promise<{ season: string; round: string }> }) {
  const { season, round } = await params
  let title = 'Fin de semana de carrera'
  let footer: string | undefined
  let rows: ReturnType<typeof podiumRows> = []
  try {
    const [calendar, results] = await withTimeout(
      Promise.all([getCalendar(Number(season)), getRaceResults(Number(season), Number(round)).catch(() => null)]),
      DATA_TIMEOUT_MS
    )
    const race = calendar.find((r) => r.round === Number(round))
    if (race) {
      title = `${race.raceName} ${season}`
      footer = `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`
    }
    if (results) rows = podiumRows(results.Results)
  } catch {
    // the card still renders without the F1 API
  }
  return ogImage({
    kicker: `Ronda ${round} · ${rows.length > 0 ? 'Resultado' : 'Gran Premio'}`,
    title,
    footer,
    rows,
    note: rows.length === 0 ? 'Hilo del fin de semana, resultado y votación de Piloto del Día' : undefined,
  })
}
