import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import DriverOfDay, { type Candidate } from '@/components/race-hub/DriverOfDay'
import SessionList from '@/components/f1-dashboard/SessionList'
import ResultsTable from '@/components/f1-dashboard/ResultsTable'
import DataError from '@/components/f1-dashboard/DataError'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { dotdTally } from '@/lib/dotd'
import JsonLd from '@/components/JsonLd'
import { absoluteUrl } from '@/lib/seo'
import { raceStatus, sessionStart } from '@/lib/f1/calendar'
import { formatRaceDate } from '@/lib/f1/format'
import { getCalendar, getRaceResults } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'
import { canAccessDashboard } from '@/lib/features'
import { dotdState, weekendStarted } from '@/lib/raceHub'
import { ensureRaceThread, type RaceThread } from '@/lib/raceThread'

// Depends on the current time (thread creation, voting window) and on the viewer.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ season: string; round: string }>
}

const parse = (value: string) => (/^\d{1,4}$/.test(value) ? Number(value) : NaN)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season: rawSeason, round: rawRound } = await params
  const season = parse(rawSeason)
  const round = parse(rawRound)
  const fallback: Metadata = {
    title: 'Fin de semana de carrera',
    description: 'Hilo del fin de semana, resultado y votación de Piloto del Día de este Gran Premio en FastLap.',
  }
  if (!Number.isInteger(season) || !Number.isInteger(round)) return fallback
  try {
    const race = (await getCalendar(season)).find((r) => r.round === round)
    if (!race) return fallback
    const { locality, country } = race.Circuit.Location
    const description = `${race.raceName} ${season} (ronda ${round}) en ${race.Circuit.circuitName}, ${locality}, ${country}: hilo del fin de semana, resultado y votación de Piloto del Día.`
    return {
      title: `${race.raceName} ${season}`,
      description,
      alternates: { canonical: `/gp/${season}/${round}` },
      openGraph: { title: `${race.raceName} ${season} · FastLap`, description, url: `/gp/${season}/${round}` },
    }
  } catch {
    return fallback // the F1 API is down: still a valid page
  }
}

const RaceHubPage = async ({ params }: Props) => {
  const { season: rawSeason, round: rawRound } = await params
  const season = parse(rawSeason)
  const round = parse(rawRound)
  if (!Number.isInteger(season) || !Number.isInteger(round) || season < 1950 || round < 1 || round > 40) notFound()

  const [calendar, results] = await Promise.allSettled([getCalendar(season), getRaceResults(season, round)])
  const raceResults = results.status === 'fulfilled' ? results.value : null
  const race: Race | undefined =
    raceResults ?? (calendar.status === 'fulfilled' ? calendar.value.find((r) => r.round === round) : undefined)

  if (!race) {
    if (calendar.status === 'rejected' && results.status === 'rejected') {
      return (
        <div className='mx-auto max-w-3xl space-y-6 py-6'>
          <DataError refresh />
        </div>
      )
    }
    notFound()
  }

  const now = new Date()
  const session = await getAuthSession()
  const hasResults = raceResults !== null && raceResults.Results.length > 0
  const state = dotdState(race, hasResults, now)
  const status = raceStatus(race, now)

  let thread: RaceThread | null = null
  if (weekendStarted(race, now)) {
    try {
      thread = await ensureRaceThread(race)
    } catch (error) {
      console.error('Race thread unavailable', error)
    }
  }

  const candidates: Candidate[] = hasResults
    ? raceResults.Results.map((r) => ({
        driverId: r.Driver.driverId,
        name: `${r.Driver.givenName} ${r.Driver.familyName}`,
        code: r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase(),
        team: r.Constructor.name,
      }))
    : []

  let initialTally: Awaited<ReturnType<typeof dotdTally>> = []
  let mine: string | null = null
  if (state !== 'not-open') {
    try {
      initialTally = await dotdTally(season, round)
      if (session?.user) {
        const vote = await db.driverOfDayVote.findUnique({
          where: { userId_season_round: { userId: session.user.id, season, round } },
        })
        mine = vote?.driverId ?? null
      }
    } catch (error) {
      console.error('Driver of the Day tally unavailable', error)
    }
  }

  const { locality, country } = race.Circuit.Location
  const { start: raceStart } = sessionStart(race.date, race.time)
  const showDashboard = !session?.user ? false : canAccessDashboard(session.user.role)

  return (
    <div className='mx-auto max-w-3xl space-y-8 py-6'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: `${race.raceName} ${season}`,
          sport: 'Formula 1',
          startDate: raceStart.toISOString(),
          url: absoluteUrl(`/gp/${season}/${round}`),
          location: {
            '@type': 'Place',
            name: race.Circuit.circuitName,
            address: { '@type': 'PostalAddress', addressLocality: locality, addressCountry: country },
          },
        }}
      />
      <header>
        <p className='label'>
          TEMPORADA {season} · RONDA {round} · {formatRaceDate(race.date).toUpperCase()}
        </p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>{race.raceName}</h1>
        <p className='mt-2 text-muted-foreground'>
          {race.Circuit.circuitName} · {locality}, {country}
        </p>
      </header>

      <section aria-labelledby='thread-title' className='space-y-3'>
        <h2 id='thread-title' className='label'>HILO DEL FIN DE SEMANA</h2>
        {thread ? (
          <Link
            href={`/r/${thread.community}/post/${thread.postId}`}
            className='flex items-center justify-between gap-4 rounded-xl border border-input bg-card p-5 text-display transition-colors hover:border-display'>
            <span>Comenta el fin de semana en r/{thread.community}</span>
            <span aria-hidden='true'>→</span>
          </Link>
        ) : (
          <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
            El hilo se abrirá cuando empiece el fin de semana (primera sesión de libres).
          </p>
        )}
      </section>

      {hasResults ? (
        <section aria-labelledby='top-title' className='space-y-4'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <h2 id='top-title' className='label'>RESULTADO · 10 PRIMEROS</h2>
            {showDashboard && (
              <Link
                href={`/f1-dashboard/carrera/${season}/${round}`}
                className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
                DETALLE EN F1
              </Link>
            )}
          </div>
          <ResultsTable results={raceResults.Results.slice(0, 10)} caption={`Diez primeros de ${race.raceName} ${season}`} />
        </section>
      ) : (
        <section className='space-y-4'>
          <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
            {status === 'finished'
              ? 'Todavía no hay resultados publicados. Suelen aparecer poco después de terminar.'
              : status === 'in-progress'
                ? 'La carrera está en curso. Los resultados aparecerán cuando termine.'
                : 'Esta carrera aún no se ha disputado.'}
          </p>
          <h2 className='label'>HORARIO DEL FIN DE SEMANA</h2>
          <SessionList race={race} />
        </section>
      )}

      <DriverOfDay
        season={season}
        round={round}
        candidates={candidates}
        state={state}
        initialTally={initialTally}
        initialMine={mine}
        signedIn={Boolean(session?.user)}
      />
    </div>
  )
}

export default RaceHubPage
