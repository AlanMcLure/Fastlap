import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import DataError from '@/components/f1-dashboard/DataError'
import LeagueCreateForm from '@/components/league/LeagueCreateForm'
import PredictionForm, { type DriverOption } from '@/components/league/PredictionForm'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { raceStatus } from '@/lib/f1/calendar'
import { getCalendar, getDrivers } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'
import {
  buildLeaderboard,
  outcomeKey,
  predictionDeadline,
  scorePrediction,
  type LeagueRules,
  type Outcome,
  type PredictionKind,
} from '@/lib/league'
import { loadOutcomes } from '@/lib/leagueData'
import ScrollRegion from '@/components/ScrollRegion'

// Depends on the clock (deadlines) and on the viewer.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Liga de pronósticos' }

const LEADERBOARD_SIZE = 20

const LeaguePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const session = await getAuthSession()

  const subreddit = await db.subreddit.findFirst({ where: { name: slug } })
  if (!subreddit) notFound()

  const league = await db.predictionLeague.findFirst({
    where: { subredditId: subreddit.id },
    orderBy: { season: 'desc' },
    include: { predictions: { include: { user: { select: { id: true, username: true, name: true } } } } },
  })

  const canManage = !!session?.user && (subreddit.creatorId === session.user.id || session.user.role === 'ADMIN')

  if (!league) {
    return (
      <div className='space-y-6'>
        <div>
          <p className='label'>COMUNIDAD · r/{slug}</p>
          <h1 className='mt-2 text-3xl font-bold text-display'>Liga de pronósticos</h1>
        </div>
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
          Esta comunidad todavía no tiene liga de pronósticos.
          {canManage ? ' Ábrela para que los miembros pronostiquen el podio de cada carrera.' : ' Pídele al creador que la abra.'}
        </p>
        {canManage && <LeagueCreateForm subredditId={subreddit.id} />}
      </div>
    )
  }

  const rules: LeagueRules = {
    exactPoints: league.exactPoints,
    presentPoints: league.presentPoints,
    fastestLapPoints: league.fastestLapPoints,
    sprintEnabled: league.sprintEnabled,
  }

  // Each block loads on its own: a failing one does not hide the rest.
  const [calendarResult, driversResult, outcomesResult] = await Promise.allSettled([
    getCalendar(league.season),
    getDrivers(league.season),
    loadOutcomes(league.season),
  ])
  const races: Race[] = calendarResult.status === 'fulfilled' ? calendarResult.value : []
  const drivers: DriverOption[] =
    driversResult.status === 'fulfilled'
      ? driversResult.value
          .map((d) => ({ id: d.driverId, name: `${d.givenName} ${d.familyName}` }))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      : []
  const outcomes: Map<string, Outcome> = outcomesResult.status === 'fulfilled' ? outcomesResult.value : new Map()

  const now = new Date()
  const next = races.find((r) => raceStatus(r, now) !== 'finished')
  const me = session?.user?.id
  const mine = new Map(
    league.predictions.filter((p) => p.userId === me).map((p) => [outcomeKey(p.round, p.kind), p])
  )

  const board = buildLeaderboard(
    league.predictions.map((p) => ({
      userId: p.userId,
      round: p.round,
      kind: p.kind,
      pick: { p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap },
    })),
    outcomes,
    rules
  )
  const names = new Map(league.predictions.map((p) => [p.userId, p.user.username ?? p.user.name ?? 'usuario']))
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id
  const raceName = (round: number) => races.find((r) => r.round === round)?.raceName ?? `Ronda ${round}`

  const history = [...mine.values()]
    .map((p) => {
      const outcome = outcomes.get(outcomeKey(p.round, p.kind))
      return {
        key: outcomeKey(p.round, p.kind),
        round: p.round,
        kind: p.kind as PredictionKind,
        score: outcome ? scorePrediction({ p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap }, outcome, rules, p.kind) : null,
        pick: [p.p1, p.p2, p.p3].map(driverName).join(' · '),
      }
    })
    .sort((a, b) => b.round - a.round || a.kind.localeCompare(b.kind))

  const forms = next
    ? (['RACE', 'SPRINT'] as const).flatMap((kind) => {
        if (kind === 'SPRINT' && !league.sprintEnabled) return []
        const deadline = predictionDeadline(next, kind)
        if (!deadline) return []
        const saved = mine.get(outcomeKey(next.round, kind))
        return [{
          kind,
          deadline,
          locked: now >= deadline,
          initial: saved ? { p1: saved.p1, p2: saved.p2, p3: saved.p3, fastestLap: saved.fastestLap } : null,
        }]
      })
    : []

  return (
    <div className='space-y-8'>
      <div>
        <p className='label'>COMUNIDAD · r/{slug} · TEMPORADA {league.season}</p>
        <h1 className='mt-2 text-3xl font-bold text-display'>Liga de pronósticos</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Pronostica el podio de cada carrera antes de la clasificación: {rules.exactPoints} puntos por puesto exacto,{' '}
          {rules.presentPoints} si el piloto acaba en el podio en otro puesto
          {rules.fastestLapPoints > 0 && `, y ${rules.fastestLapPoints} por acertar la vuelta rápida`}
          {rules.sprintEnabled && '. Las carreras sprint puntúan igual (sin vuelta rápida)'}. Participa cualquier usuario con
          sesión; la puntuación es automática con los resultados oficiales.
        </p>
      </div>

      {calendarResult.status === 'rejected' || driversResult.status === 'rejected' ? (
        <DataError message='No se han podido cargar el calendario o los pilotos, así que no se puede pronosticar ahora.' refresh />
      ) : next ? (
        <section aria-labelledby='next-title' className='space-y-4'>
          <h2 id='next-title' className='label'>
            PRÓXIMA CARRERA · RONDA {next.round} · {next.raceName.toUpperCase()}
          </h2>
          {!session?.user ? (
            <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
              <Link href='/sign-in' className='text-display underline underline-offset-4'>Inicia sesión</Link> para pronosticar.
            </p>
          ) : (
            forms.map((form) => (
              <PredictionForm
                key={`${next.round}-${form.kind}`}
                leagueId={league.id}
                round={next.round}
                kind={form.kind}
                drivers={drivers}
                initial={form.initial}
                deadlineIso={form.deadline.toISOString()}
                locked={form.locked}
              />
            ))
          )}
        </section>
      ) : (
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>No quedan carreras esta temporada.</p>
      )}

      <section aria-labelledby='board-title' className='space-y-4'>
        <h2 id='board-title' className='label'>CLASIFICACIÓN</h2>
        {board.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Todavía no hay pronósticos. ¡Sé el primero!</p>
        ) : (
          <ScrollRegion label={'Clasificación de la liga de pronósticos'}>
            <table className='w-full border-collapse text-left tabular-nums'>
              <caption className='sr-only'>Clasificación de la liga de pronósticos</caption>
              <thead>
                <tr className='label border-b border-border'>
                  <th scope='col' className='w-12 px-3 py-3 font-normal sm:px-4'>POS</th>
                  <th scope='col' className='px-2 py-3 font-normal'>USUARIO</th>
                  <th scope='col' className='hidden w-20 px-2 py-3 text-right font-normal sm:table-cell'>EXACTOS</th>
                  <th scope='col' className='w-16 px-2 py-3 text-right font-normal'>PRON.</th>
                  <th scope='col' className='w-16 px-3 py-3 text-right font-normal sm:px-4'>PTS</th>
                </tr>
              </thead>
              <tbody>
                {board.slice(0, LEADERBOARD_SIZE).map((entry) => (
                  <tr key={entry.userId} className='border-b border-border last:border-0'>
                    <td className='px-3 py-3 text-muted-foreground sm:px-4'>{entry.rank}</td>
                    <td className='px-2 py-3 text-foreground'>
                      {names.get(entry.userId)}
                      {entry.userId === me && <span className='label ml-2'>TÚ</span>}
                    </td>
                    <td className='hidden px-2 py-3 text-right text-muted-foreground sm:table-cell'>{entry.exact}</td>
                    <td className='px-2 py-3 text-right text-muted-foreground'>{entry.scored}</td>
                    <td className='px-3 py-3 text-right text-display sm:px-4'>{entry.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        )}
        {board.length > LEADERBOARD_SIZE && (
          <p className='label'>MOSTRANDO LOS {LEADERBOARD_SIZE} PRIMEROS DE {board.length}</p>
        )}
      </section>

      {history.length > 0 && (
        <section aria-labelledby='mine-title' className='space-y-4'>
          <h2 id='mine-title' className='label'>MIS PRONÓSTICOS</h2>
          <ul className='divide-y divide-border rounded-xl border border-input bg-card'>
            {history.map((h) => (
              <li key={h.key} className='flex items-baseline justify-between gap-4 px-5 py-3'>
                <div className='min-w-0'>
                  <p className='text-foreground'>
                    {raceName(h.round)}
                    {h.kind === 'SPRINT' && <span className='label ml-2'>SPRINT</span>}
                  </p>
                  <p className='truncate text-sm text-muted-foreground'>{h.pick}</p>
                </div>
                <p className='shrink-0 tabular-nums text-display'>
                  {h.score ? `${h.score.total} pts` : <span className='label'>PENDIENTE</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default LeaguePage
