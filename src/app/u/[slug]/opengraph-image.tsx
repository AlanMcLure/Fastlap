import { db } from '@/lib/db'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'
import { loadProfilePredictions } from '@/lib/predictionData'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Perfil de un usuario de FastLap'
export const dynamic = 'force-dynamic'

/** Share card of a profile: prediction stats (and the badges) when the user has predicted. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await db.user.findFirst({ where: { username: slug }, select: { id: true, username: true } })
  const data = user ? await loadProfilePredictions(user.id).catch(() => null) : null

  return ogImage({
    kicker: data ? `Pronósticos · temporada ${data.season}` : 'Perfil',
    title: `u/${user?.username ?? slug}`,
    stats: data
      ? [
          { label: 'Puntos', value: String(data.stats.points) },
          { label: 'Exactos', value: String(data.stats.exact) },
          { label: 'Racha', value: String(data.stats.streak) },
          { label: 'Pronósticos', value: String(data.stats.predictions) },
        ]
      : [],
    rows: data ? data.badges.slice(0, 2).map((b) => ({ rank: '', label: b.label })) : [],
    note: data ? undefined : 'Miembro de la comunidad de aficionados de la Fórmula 1',
  })
}
