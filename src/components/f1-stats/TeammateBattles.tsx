import type { TeammateBattle } from '@/lib/f1stats/schemas'
import { share } from '@/lib/f1stats/season'

interface TeammateBattlesProps {
  battles: TeammateBattle[]
  codes: Map<string, string>
}

const Duel = ({ label, a, b }: { label: string; a: number; b: number }) => {
  const left = share(a, b) * 100
  return (
    <div>
      <div className='flex items-baseline justify-between font-mono text-sm tabular-nums'>
        <span className={a >= b ? 'text-display' : 'text-muted-foreground'}>{a}</span>
        <span className='label'>{label}</span>
        <span className={b >= a ? 'text-display' : 'text-muted-foreground'}>{b}</span>
      </div>
      <div className='mt-1 flex h-1.5 overflow-hidden rounded-full bg-border' aria-hidden='true'>
        <span className='h-full bg-display' style={{ width: `${left}%` }} />
        <span className='h-full flex-1 bg-faint' />
      </div>
    </div>
  )
}

/** One card per pair of teammates: qualifying and race head-to-head, points and the median qualifying gap. */
const TeammateBattles = ({ battles, codes }: TeammateBattlesProps) => (
  <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
    {battles.map((battle) => {
      const a = codes.get(battle.driverId) ?? battle.driverId
      const b = codes.get(battle.teammateId) ?? battle.teammateId
      return (
        <li key={`${battle.constructorId}-${battle.driverId}-${battle.teammateId}`} className='rounded-xl border border-border bg-card p-4'>
          <p className='label'>{(battle.constructorName ?? battle.constructorId).toUpperCase()} · {battle.races} CARRERAS</p>
          <p className='mt-2 flex items-baseline justify-between'>
            <span className='font-mono text-lg font-bold text-display' title={battle.driverName ?? undefined}>{a}</span>
            <span className='label'>CONTRA</span>
            <span className='font-mono text-lg font-bold text-display' title={battle.teammateName ?? undefined}>{b}</span>
          </p>
          <div className='mt-3 space-y-3'>
            <Duel label='CLASIFICACIÓN' a={battle.qualifying.driver} b={battle.qualifying.opponent} />
            <Duel label='CARRERA' a={battle.raceFinishes.driver} b={battle.raceFinishes.opponent} />
            <Duel label='PUNTOS' a={battle.points.driver} b={battle.points.opponent} />
          </div>
          <p className='mt-3 text-sm text-muted-foreground'>
            {battle.qualifyingGapPercent == null
              ? 'Sin tiempos comparables en clasificación.'
              : `${battle.qualifyingGapPercent >= 0 ? a : b} es un ${Math.abs(battle.qualifyingGapPercent).toFixed(2).replace('.', ',')} % más rápido a una vuelta (mediana de ${battle.qualifyingGapSamples}).`}
          </p>
        </li>
      )
    })}
  </ul>
)

export default TeammateBattles
