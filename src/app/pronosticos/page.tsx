import type { Metadata } from 'next'
import Link from 'next/link'

import DataError from '@/components/f1-dashboard/DataError'
import ShareActions from '@/components/ShareActions'
import { cardFileName } from '@/lib/shareCards'
import SeasonSelect from '@/components/f1-dashboard/SeasonSelect'
import { getAuthSession } from '@/lib/auth'
import { resolveSeason } from '@/lib/f1/season'
import { GLOBAL_RULES } from '@/lib/profileStats'
import { leagueSeasons, loadGlobalBoard } from '@/lib/predictionData'
import ScrollRegion from '@/components/ScrollRegion'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Clasificación global de pronósticos',
  description: 'Quién acierta más el podio de cada Gran Premio: clasificación global de pronósticos de la comunidad de FastLap.',
  alternates: { canonical: '/pronosticos' },
}

const SIZE = 50

const GlobalPredictionsPage = async ({ searchParams }: { searchParams: Promise<{ season?: string }> }) => {
  const { season: rawSeason } = await searchParams
  const season = resolveSeason(rawSeason)
  const session = await getAuthSession()

  let data: Awaited<ReturnType<typeof loadGlobalBoard>> | null = null
  let years: number[] = [season]
  try {
    const [loaded, seasons] = await Promise.all([loadGlobalBoard(season), leagueSeasons()])
    data = loaded
    years = [...new Set([season, ...seasons])].sort((a, b) => b - a)
  } catch (error) {
    console.error('Global predictions unavailable', error)
  }

  const me = session?.user?.id

  return (
    <div className='mx-auto max-w-3xl space-y-8 py-6'>
      <header className='space-y-3'>
        <p className='label'>PRONÓSTICOS · TEMPORADA {season}</p>
        <h1 className='text-3xl font-bold text-display'>Clasificación global</h1>
        <p className='text-sm text-muted-foreground'>
          Todos los pronósticos de las ligas de las comunidades, con las mismas reglas para todos: {GLOBAL_RULES.exactPoints} puntos
          por puesto exacto del podio, {GLOBAL_RULES.presentPoints} si el piloto acaba en el podio en otro puesto y{' '}
          {GLOBAL_RULES.fastestLapPoints} por la vuelta rápida. Si pronosticas la misma carrera en varias ligas cuenta el primer
          pronóstico que enviaste. Desempata el número de puestos exactos.
        </p>
        <SeasonSelect value={season} years={years} basePath='/pronosticos' />
        <ShareActions
          title='Clasificación global de pronósticos de FastLap'
          path='/pronosticos'
          imageHref='/pronosticos/opengraph-image'
          fileName={cardFileName('clasificacion global', new Date().getUTCFullYear())}
        />
      </header>

      {!data ? (
        <DataError message='No se ha podido cargar la clasificación.' refresh />
      ) : (
        <>
          {data.board.length === 0 ? (
            <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
              Todavía no hay pronósticos esta temporada. Entra en una comunidad con liga y ¡sé el primero!
            </p>
          ) : (
            <ScrollRegion label={`Clasificación global de pronósticos de la temporada ${season}`}>
              <table className='w-full border-collapse text-left tabular-nums'>
                <caption className='sr-only'>Clasificación global de pronósticos de la temporada {season}</caption>
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
                  {data.board.slice(0, SIZE).map((entry) => {
                    const name = data.names.get(entry.userId) ?? 'usuario'
                    return (
                      <tr key={entry.userId} className='border-b border-border last:border-0'>
                        <td className='px-3 py-3 text-muted-foreground sm:px-4'>{entry.rank}</td>
                        <td className='px-2 py-3'>
                          <Link href={`/u/${name}`} className='text-foreground hover:text-display hover:underline underline-offset-2'>
                            {name}
                          </Link>
                          {entry.userId === me && <span className='label ml-2'>TÚ</span>}
                        </td>
                        <td className='hidden px-2 py-3 text-right text-muted-foreground sm:table-cell'>{entry.exact}</td>
                        <td className='px-2 py-3 text-right text-muted-foreground'>{entry.scored}</td>
                        <td className='px-3 py-3 text-right text-display sm:px-4'>{entry.total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollRegion>
          )}
          {data.board.length > SIZE && <p className='label'>MOSTRANDO LOS {SIZE} PRIMEROS DE {data.board.length}</p>}

          {data.leagues.length > 0 && (
            <section aria-labelledby='leagues-title' className='space-y-3'>
              <h2 id='leagues-title' className='label'>LIGAS DE LA TEMPORADA</h2>
              <ul className='divide-y divide-border rounded-xl border border-input bg-card'>
                {data.leagues.map((l) => (
                  <li key={l.community}>
                    <Link
                      href={`/r/${l.community}/liga`}
                      className='flex items-baseline justify-between gap-4 px-5 py-3 transition-colors hover:bg-accent'>
                      <span className='text-foreground'>r/{l.community}</span>
                      <span className='label'>{l.predictions} {l.predictions === 1 ? 'PRONÓSTICO' : 'PRONÓSTICOS'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default GlobalPredictionsPage
