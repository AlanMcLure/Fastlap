import Link from 'next/link'
import { notFound } from 'next/navigation'

import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import StatTile from '@/components/f1-dashboard/StatTile'
import BarList from '@/components/f1-stats/BarList'
import BestLapsTable from '@/components/f1-stats/BestLapsTable'
import CompareDriversForm from '@/components/f1-stats/CompareDriversForm'
import DriverLineChart from '@/components/f1-stats/DriverLineChart'
import LapComparisonChart from '@/components/f1-stats/LapComparisonChart'
import StatsAttribution from '@/components/f1-stats/StatsAttribution'
import StrategyChart from '@/components/f1-stats/StrategyChart'
import { statsEnabled } from '@/lib/f1stats/client'
import {
  getLapComparison,
  getSessionBestLaps,
  getSessionGaps,
  getSessionLapChart,
  getSessionOvertakes,
  getSessionPits,
  getSessionRaceControl,
  getSessionStintPace,
  getSessionStints,
  getSessionSummary,
  getSessionWeather,
  getStatsRace,
  getTimingSessions,
  isDetailedSession,
  type DetailedSession,
} from '@/lib/f1stats/queries'
import {
  chartDrivers,
  fastestPits,
  formatDelta,
  formatLapTime,
  gapRows,
  isRaceSession,
  longRuns,
  neutralisations,
  paceRanking,
  penalties,
  positionRows,
  SESSION_LABEL,
  sessionTabs,
  strategyRows,
  tyre,
  weatherSummary,
} from '@/lib/f1stats/race'
import type { TimingSession } from '@/lib/f1stats/schemas'

// The selected session and drivers come from the URL.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Análisis de carrera · FastLap' }

interface AnalysisPageProps {
  params: Promise<{ season: string; carreraId: string }>
  searchParams: Promise<{ sesion?: string; a?: string; b?: string }>
}

const parseInt10 = (value: string) => (/^\d{1,4}$/.test(value) ? Number(value) : NaN)

/** Resolves a promise to null instead of throwing, logging the failure: one block failing never hides the rest. */
async function safe<T>(name: string, promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    console.error(`Could not load ${name}`, error)
    return null
  }
}

const AnalysisPage = async ({ params, searchParams }: AnalysisPageProps) => {
  if (!statsEnabled()) notFound()
  const { season: rawSeason, carreraId } = await params
  const query = await searchParams
  const season = parseInt10(rawSeason)
  const round = parseInt10(carreraId)
  if (!Number.isInteger(season) || !Number.isInteger(round) || season < 1950 || round < 1 || round > 40) notFound()

  const basePath = `/f1-dashboard/carrera/${season}/${round}`
  let race
  try {
    race = await getStatsRace(season, round)
  } catch (error) {
    console.error('Could not load the race from api-f1', error)
    return (
      <div className='max-w-5xl space-y-6'>
        <BackButton defaultPath={basePath} backText='Volver a la carrera' className='-ml-5' />
        <DataError message='Los datos de análisis no están disponibles ahora mismo.' refresh />
      </div>
    )
  }
  if (!race) notFound()

  const sessions: TimingSession[] = (await safe('timing sessions', getTimingSessions(race.id, season))) ?? []
  const tabs = sessionTabs(sessions)
  const requested = isDetailedSession(query.sesion) ? query.sesion : undefined
  const fallback = tabs.find((t) => t.slug === 'race')?.slug ?? tabs[0]?.slug
  const session = (requested && tabs.some((t) => t.slug === requested) ? requested : fallback) as DetailedSession | undefined
  const info = sessions.find((s) => s.slug === session)

  const header = (
    <div>
      <BackButton defaultPath={basePath} backText='Volver a la carrera' className='-ml-5' />
      <p className='label mt-4'>
        TEMPORADA {season} · RONDA {round} · ANÁLISIS
      </p>
      <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>{race.officialName}</h1>
      <p className='mt-2 text-muted-foreground'>
        {race.laps ? `${race.laps} vueltas · ` : ''}
        {race.courseLength ? `${race.courseLength} km por vuelta · ` : ''}
        {race.turns ? `${race.turns} curvas · ` : ''}
        <Link href={`/f1-dashboard/circuito/${race.circuitId}`} className='underline-offset-4 hover:text-display hover:underline'>
          Historia del circuito
        </Link>
      </p>
      {tabs.length > 0 && (
        <nav aria-label='Sesiones del fin de semana' className='-mx-1 mt-6 overflow-x-auto px-1 pb-1'>
          <ul className='inline-flex min-w-max gap-1 rounded-full border border-input p-0.5'>
            {tabs.map((tab) => (
              <li key={tab.slug}>
                <Link
                  href={`${basePath}/analisis?sesion=${tab.slug}`}
                  aria-current={tab.slug === session ? 'page' : undefined}
                  className={`label block whitespace-nowrap rounded-full px-4 py-2 transition-colors ${
                    tab.slug === session ? 'bg-primary text-primary-foreground' : 'hover:text-display'
                  }`}>
                  {tab.label.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )

  if (!session) {
    return (
      <div className='max-w-5xl space-y-8'>
        {header}
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
          {season < 2023
            ? 'Los datos detallados (vueltas, neumáticos, distancias) solo existen desde la temporada 2023.'
            : 'Todavía no hay datos detallados de este Gran Premio. Se importan unas horas después de cada sesión.'}
        </p>
        <StatsAttribution detailed={false} />
      </div>
    )
  }

  return (
    <div className='max-w-5xl space-y-8'>
      {header}
      {isRaceSession(session) ? (
        <RaceAnalysis raceId={race.id} season={season} session={session} info={info} basePath={basePath} a={query.a} b={query.b} />
      ) : (
        <TimedAnalysis raceId={race.id} season={season} session={session} info={info} />
      )}
      <StatsAttribution detailed />
    </div>
  )
}

interface SessionProps {
  raceId: number
  season: number
  session: DetailedSession
  info?: TimingSession
}

const RaceAnalysis = async ({
  raceId,
  season,
  session,
  info,
  basePath,
  a,
  b,
}: SessionProps & { basePath: string; a?: string; b?: string }) => {
  const [summary, stints, pits, weather, control, lapChart, gaps, overtakes] = await Promise.all([
    safe('summary', getSessionSummary(raceId, session, season)),
    safe('stints', getSessionStints(raceId, session, season)),
    safe('pits', getSessionPits(raceId, session, season)),
    safe('weather', getSessionWeather(raceId, session, season)),
    safe('race control', getSessionRaceControl(raceId, session, season)),
    safe('lap chart', getSessionLapChart(raceId, session, season)),
    safe('gaps', getSessionGaps(raceId, session, season)),
    safe('overtakes', getSessionOvertakes(raceId, session, season)),
  ])
  if (!summary?.length) {
    return <DataError message='No se han podido cargar los datos de esta sesión.' refresh />
  }

  const drivers = chartDrivers(summary)
  const codeOf = new Map(summary.map((s) => [s.driverNumber, s.nameAcronym ?? String(s.driverNumber)]))
  const { rows: strategy, laps } = strategyRows(summary, stints ?? [])
  const periods = neutralisations(control ?? [], laps)
  const top3 = drivers.slice(0, 3).map((d) => d.number)
  const fastest = [...summary].filter((s) => s.bestLap != null).sort((x, y) => x.bestLap! - y.bestLap!)[0]
  const sky = weatherSummary(weather ?? [], info?.dateStart, info?.dateEnd)
  const pace = paceRanking(summary)
  const topSpeeds = [...summary].filter((s) => s.topSpeed != null).sort((x, y) => y.topSpeed! - x.topSpeed!)
  const maxSpeed = topSpeeds[0]?.topSpeed ?? 0
  const stops = fastestPits(pits ?? [], 10)
  const penaltyList = penalties(control ?? [])

  // The gap chart scale follows the top ten so lapped cars do not flatten everyone else.
  const topTenFinal = (gaps ?? [])
    .filter((g) => drivers.slice(0, 10).some((d) => d.number === g.driverNumber))
    .map((g) => g.gaps.at(-1)?.gap ?? 0)
  const gapMax = Math.ceil(Math.max(10, ...topTenFinal) * 1.15)

  // Comparison: the two drivers in the URL, or the first two finishers.
  const options = summary
    .filter((s) => s.driverId)
    .sort((x, y) => (x.finishPosition ?? 99) - (y.finishPosition ?? 99))
    .map((s) => ({ id: s.driverId!, code: s.nameAcronym ?? s.driverId! }))
  const valid = (id?: string) => options.some((o) => o.id === id)
  const driverA = valid(a) ? a! : options[0]?.id
  const driverB = valid(b) && b !== driverA ? b! : options.find((o) => o.id !== driverA)?.id
  const comparison =
    driverA && driverB ? await safe('lap comparison', getLapComparison(raceId, session, season, driverA, driverB)) : null
  const code = (id?: string) => options.find((o) => o.id === id)?.code ?? ''

  return (
    <>
      <section aria-label='Datos clave' className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        <StatTile
          label='VUELTA RÁPIDA'
          value={fastest ? formatLapTime(fastest.bestLap) : '—'}
          detail={fastest ? `${fastest.nameAcronym} · vuelta ${fastest.bestLapNumber}` : undefined}
        />
        <StatTile label='ADELANTAMIENTOS' value={overtakes?.length ?? '—'} detail='Cambios de posición en pista' />
        <StatTile
          label='NEUTRALIZACIONES'
          value={periods.length}
          detail={
            periods.length
              ? periods.map((p) => `${p.kind === 'sc' ? 'SC' : p.kind === 'vsc' ? 'VSC' : 'Roja'} V${p.fromLap}`).join(' · ')
              : 'Carrera limpia'
          }
        />
        <StatTile
          label='PISTA'
          value={sky.track ? `${Math.round(sky.track[0])}–${Math.round(sky.track[1])} °C` : '—'}
          detail={`${sky.air ? `Aire ${Math.round(sky.air[0])}–${Math.round(sky.air[1])} °C` : ''}${sky.rain ? ' · Lluvia' : ''}`}
        />
      </section>

      {gaps && gaps.length > 0 && (
        <DriverLineChart
          title='DISTANCIA AL LÍDER'
          description='Segundos por detrás del primero al terminar cada vuelta. Las zonas grises son safety car, VSC o bandera roja.'
          rows={gapRows(gaps)}
          drivers={drivers}
          initial={top3}
          yDomain={[0, gapMax]}
          unit='gap'
          neutralisations={periods}
          footnote='La escala se ajusta a los diez primeros: los doblados se salen por abajo.'
        />
      )}

      {lapChart && lapChart.length > 0 && (
        <DriverLineChart
          title='POSICIONES VUELTA A VUELTA'
          description='Posición de cada piloto al cruzar la línea en cada vuelta.'
          rows={positionRows(lapChart)}
          drivers={drivers}
          initial={top3}
          reversed
          yDomain={[1, drivers.length]}
          unit='position'
          neutralisations={periods}
        />
      )}

      {strategy.some((row) => row.stints.length > 0) && <StrategyChart rows={strategy} laps={laps} neutralisations={periods} />}

      <div className='grid gap-6 lg:grid-cols-2'>
        <BarList
          title='RITMO DE CARRERA'
          description='Media de las vueltas representativas: sin la vuelta 1, ni las de boxes, ni las lentas (safety car, tráfico).'
          items={pace.map((row) => ({
            key: String(row.driverNumber),
            label: row.code,
            detail: row.team,
            value: row.delta,
            display: row.delta === 0 ? formatLapTime(row.averageLap) : formatDelta(row.delta),
          }))}
        />
        <BarList
          title='VELOCIDAD PUNTA'
          description='Máxima en la trampa de velocidad, en km/h.'
          items={topSpeeds.map((s) => ({
            key: String(s.driverNumber),
            label: s.nameAcronym ?? String(s.driverNumber),
            detail: s.teamName,
            value: maxSpeed - s.topSpeed!,
            display: String(s.topSpeed),
          }))}
        />
      </div>

      {options.length >= 2 && driverA && driverB && (
        <section id='comparar' aria-labelledby='compare-title' className='scroll-mt-28 space-y-4'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
            <h2 id='compare-title' className='label'>CARA A CARA EN PISTA</h2>
            <CompareDriversForm action={`${basePath}/analisis#comparar`} session={session} options={options} a={driverA} b={driverB} />
          </div>
          {comparison ? (
            <LapComparisonChart comparison={comparison} codeA={code(driverA)} codeB={code(driverB)} />
          ) : (
            <p className='text-sm text-muted-foreground'>No hay vueltas suficientes para comparar a estos pilotos.</p>
          )}
        </section>
      )}

      {stops.length > 0 && (
        <BarList
          title='PARADAS MÁS RÁPIDAS'
          description='Tiempo con el coche parado (cuando se conoce) y tiempo total en el pit lane.'
          items={stops.map((pit, index) => {
            const stop = pit.stopDuration != null && pit.stopDuration >= 1.5 ? pit.stopDuration : null
            const base = stops[0].stopDuration ?? 0
            return {
              key: `${pit.driverNumber}-${pit.lapNumber}-${index}`,
              label: codeOf.get(pit.driverNumber) ?? String(pit.driverNumber),
              detail: `Vuelta ${pit.lapNumber ?? '?'}`,
              value: stop != null ? stop - base : 0,
              display: stop != null ? `${stop.toFixed(1)} s` : '—',
              aside: pit.laneDuration != null ? `pit lane ${pit.laneDuration.toFixed(1)} s · V${pit.lapNumber ?? '?'}` : undefined,
            }
          })}
        />
      )}

      {penaltyList.length > 0 && (
        <section aria-labelledby='penalties-title' className='space-y-3'>
          <h2 id='penalties-title' className='label'>SANCIONES DE LOS COMISARIOS</h2>
          <ul className='divide-y divide-border rounded-2xl border border-input bg-card'>
            {penaltyList.map((penalty, index) => (
              <li key={index} className='flex gap-4 px-4 py-3 text-sm'>
                <span className='w-12 shrink-0 font-mono text-muted-foreground'>{penalty.lap ? `V${penalty.lap}` : '—'}</span>
                <span className='text-foreground'>{penalty.text}</span>
              </li>
            ))}
          </ul>
          <p className='text-xs text-muted-foreground'>Textos originales de la dirección de carrera (en inglés).</p>
        </section>
      )}

      <p className='text-xs text-muted-foreground'>
        Compuestos: {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map((c) => `${tyre(c).letter} = ${tyre(c).name.toLowerCase()}`).join(', ')}.
        Los datos de neumáticos de OpenF1 pueden ser incorrectos en carreras con lluvia.
      </p>
    </>
  )
}

const TimedAnalysis = async ({ raceId, season, session, info }: SessionProps) => {
  const isPractice = session.startsWith('free-practice')
  const [best, stintPace, weather] = await Promise.all([
    safe('best laps', getSessionBestLaps(raceId, session, season)),
    isPractice ? safe('stint pace', getSessionStintPace(raceId, session, season)) : Promise.resolve(null),
    safe('weather', getSessionWeather(raceId, session, season)),
  ])
  if (!best?.length) {
    return <DataError message='No se han podido cargar los datos de esta sesión.' refresh />
  }

  const timed = best.filter((row) => row.bestLap != null)
  const pole = timed[0]
  const ideal = [...timed].filter((r) => r.idealLap != null).sort((x, y) => x.idealLap! - y.idealLap!)[0]
  const sky = weatherSummary(weather ?? [], info?.dateStart, info?.dateEnd)
  const codeOf = new Map(best.map((r) => [r.driverNumber, r.nameAcronym ?? String(r.driverNumber)]))
  const runs = longRuns(stintPace ?? [])
  const label = SESSION_LABEL[session] ?? session

  return (
    <>
      <section aria-label='Datos clave' className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        <StatTile label='MEJOR VUELTA' value={formatLapTime(pole?.bestLap)} detail={pole ? `${pole.nameAcronym} · ${pole.teamName ?? ''}` : undefined} />
        <StatTile
          label='VUELTA IDEAL'
          value={formatLapTime(ideal?.idealLap)}
          detail={ideal ? `${ideal.nameAcronym}: sus mejores sectores` : undefined}
        />
        <StatTile
          label='DE P1 A P10'
          value={timed[9]?.gap != null ? formatDelta(timed[9].gap) : '—'}
          detail='Lo apretada que estuvo la sesión'
        />
        <StatTile
          label='PISTA'
          value={sky.track ? `${Math.round(sky.track[0])}–${Math.round(sky.track[1])} °C` : '—'}
          detail={`${sky.air ? `Aire ${Math.round(sky.air[0])}–${Math.round(sky.air[1])} °C` : ''}${sky.rain ? ' · Lluvia' : ''}`}
        />
      </section>

      <section aria-labelledby='best-title' className='space-y-4'>
        <h2 id='best-title' className='label'>MEJORES VUELTAS · {label.toUpperCase()}</h2>
        <BestLapsTable rows={best} caption={`Mejores vueltas de ${label}`} />
        <p className='text-xs text-muted-foreground'>
          ◆ mejor sector de la sesión. IDEAL: suma de los mejores sectores de cada piloto. OpenF1 no marca las vueltas anuladas
          por límites de pista, así que alguna mejor vuelta puede no ser la oficial.
        </p>
      </section>

      <BarList
        title='DIFERENCIA CON EL MÁS RÁPIDO'
        items={timed.map((row) => ({
          key: String(row.driverNumber),
          label: row.nameAcronym ?? String(row.driverNumber),
          detail: row.teamName,
          value: row.gap ?? 0,
          display: row.position === 1 ? formatLapTime(row.bestLap) : formatDelta(row.gap),
        }))}
      />

      {isPractice && (
        <BarList
          title='SIMULACIONES DE CARRERA'
          description='Tandas largas (5 vueltas representativas o más): ritmo medio y compuesto. Pesan mucho la gasolina y los modos de motor, que no se conocen.'
          items={runs.slice(0, 15).map((run, index) => ({
            key: `${run.driverNumber}-${run.stintNumber}-${index}`,
            label: codeOf.get(run.driverNumber) ?? String(run.driverNumber),
            detail: `${tyre(run.compound).name} · ${run.representativeLaps} vueltas`,
            value: run.averageLap! - runs[0].averageLap!,
            display: index === 0 ? formatLapTime(run.averageLap) : formatDelta(run.averageLap! - runs[0].averageLap!),
            aside: `${tyre(run.compound).letter} · ${run.representativeLaps} v.${run.degradationPerLap != null ? ` · ${formatDelta(run.degradationPerLap, 2)} s/v` : ''}`,
          }))}
          emptyText='Nadie hizo tandas largas en esta sesión.'
        />
      )}
    </>
  )
}

export default AnalysisPage
