import { getCalendar } from '@/lib/f1/queries'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Fin de semana de carrera en FastLap'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ season: string; round: string }> }) {
  const { season, round } = await params
  let title = 'Fin de semana de carrera'
  let footer: string | undefined
  try {
    const race = (await getCalendar(Number(season))).find((r) => r.round === Number(round))
    if (race) {
      title = race.raceName
      footer = `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`
    }
  } catch {
    // the card still renders without the F1 API
  }
  return ogImage({ kicker: `Temporada ${season} · Ronda ${round}`, title, footer })
}
