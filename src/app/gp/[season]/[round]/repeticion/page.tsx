import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import ReplayViewer from '@/components/replay/ReplayViewer'
import { getCalendar } from '@/lib/f1/queries'
import { FIRST_REPLAY_SEASON, hasReplay } from '@/lib/replay/replays'
import { withTimeout } from '@/lib/timeout'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ season: string; round: string }>
}

const parse = (value: string) => (/^\d{1,4}$/.test(value) ? Number(value) : NaN)

async function raceName(season: number, round: number) {
  try {
    return (await withTimeout(getCalendar(season), 8000)).find((r) => r.round === round)?.raceName ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season, round } = await params
  const name = await raceName(parse(season), parse(round))
  return {
    title: name ? `Repetición: ${name} ${season}` : 'Repetición de la carrera',
    description: 'Revive la carrera vuelta a vuelta: los coches sobre el circuito, la clasificación y la dirección de carrera.',
    alternates: { canonical: `/gp/${season}/${round}/repeticion` },
  }
}

/** Race replay page: the viewer when the replay has been built, otherwise when to expect it. */
export default async function ReplayPage({ params }: Props) {
  const { season: rawSeason, round: rawRound } = await params
  const season = parse(rawSeason)
  const round = parse(rawRound)
  if (!Number.isInteger(season) || !Number.isInteger(round) || round < 1 || round > 40) notFound()

  const [name, available] = await Promise.all([raceName(season, round), hasReplay(season, round).catch(() => false)])

  return (
    <div className='pb-10'>
      <Link href={`/gp/${season}/${round}`} className='label inline-flex h-9 items-center gap-2 hover:text-display'>
        <span aria-hidden='true'>←</span> {name ? `${name.toUpperCase()} ${season}` : `GP ${season} · R${round}`}
      </Link>
      <p className='label mt-4'>REPETICIÓN</p>
      <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>{name ? `${name} ${season}` : 'Repetición de la carrera'}</h1>

      <div className='mt-6'>
        {available ? (
          <ReplayViewer season={season} round={round} />
        ) : (
          <p className='border-y border-border py-6 text-muted-foreground'>
            {season < FIRST_REPLAY_SEASON
              ? `Las repeticiones están disponibles desde la temporada ${FIRST_REPLAY_SEASON}.`
              : 'La repetición de esta carrera todavía no está lista. Se prepara unas horas después de que termine.'}
          </p>
        )}
      </div>
    </div>
  )
}
