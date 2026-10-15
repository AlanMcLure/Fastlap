import { notFound, redirect } from 'next/navigation'

import { statsEnabled } from '@/lib/f1stats/client'
import { getStatsRace } from '@/lib/f1stats/queries'

// The race pages use Jolpica ids; F1DB names circuits differently, so the race tells us which one it is.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ season: string; carreraId: string }>
}

const CircuitOfRace = async ({ params }: Props) => {
  if (!statsEnabled()) notFound()
  const { season, carreraId } = await params
  const year = Number(season)
  const round = Number(carreraId)
  if (!Number.isInteger(year) || !Number.isInteger(round) || year < 1950 || round < 1 || round > 40) notFound()

  const race = await getStatsRace(year, round).catch((error) => {
    console.error('Could not resolve the circuit of the race', error)
    return null
  })
  if (!race) notFound()
  redirect(`/f1-dashboard/circuito/${race.circuitId}`)
}

export default CircuitOfRace
