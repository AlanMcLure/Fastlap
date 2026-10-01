import StatTile from '@/components/f1-dashboard/StatTile'
import ShareActions from '@/components/ShareActions'
import { cardFileName } from '@/lib/shareCards'
import type { ProfilePredictions as Data } from '@/lib/predictionData'

/** Prediction stats and badges on a user profile. Server component. */
const ProfilePredictions = ({ data, username }: { data: Data; username: string }) => {
  const { stats, season, total, badges } = data
  const best = stats.bestRace

  return (
    <section aria-labelledby='pred-title' className='space-y-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 id='pred-title' className='label'>PRONÓSTICOS · TEMPORADA {season}</h2>
        <p className='label'>
          {total.points} {total.points === 1 ? 'PUNTO' : 'PUNTOS'} EN TOTAL · {total.scored} PUNTUADOS
        </p>
      </div>

      <ShareActions
        title={`Pronósticos de u/${username} en FastLap`}
        path={`/u/${username}`}
        imageHref={`/u/${username}/opengraph-image`}
        fileName={cardFileName('pronosticos', username)}
      />

      {badges.length > 0 && (
        <ul className='flex flex-wrap gap-2' aria-label='Insignias'>
          {badges.map((b) => (
            <li key={b.key} title={b.detail} className='label rounded-full border border-display px-3 py-1.5 text-display'>
              ★ {b.label.toUpperCase()}
            </li>
          ))}
        </ul>
      )}

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <StatTile label='PUNTOS' value={stats.points} detail={`${stats.average} por pronóstico`} />
        <StatTile label='PRONÓSTICOS' value={stats.predictions} detail={`${stats.scored} ya puntuados`} />
        <StatTile label='PUESTOS EXACTOS' value={stats.exact} detail={`${stats.perfect} podios perfectos`} />
        <StatTile label='RACHA' value={stats.streak} detail='seguidos con puntos' />
        <StatTile
          label='MEJOR CARRERA'
          value={best ? best.points : '–'}
          detail={best ? `ronda ${best.round}${best.kind === 'SPRINT' ? ' (sprint)' : ''}` : 'aún sin puntos'}
        />
      </div>
    </section>
  )
}

export default ProfilePredictions
