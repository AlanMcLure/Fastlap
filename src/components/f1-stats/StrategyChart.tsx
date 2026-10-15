import { tyre, type Neutralisation, type StrategyRow } from '@/lib/f1stats/race'

// Monochrome fills by compound (direction B): lightness steps instead of the broadcast colours.
const TONE = [
  'bg-display text-background',
  'bg-muted-foreground text-background',
  'bg-faint text-display',
  'border border-display text-display',
] as const

interface StrategyChartProps {
  rows: StrategyRow[]
  laps: number
  neutralisations: Neutralisation[]
}

/** Tyre strategy of every driver: one bar per stint over the race distance, in finishing order. */
const StrategyChart = ({ rows, laps, neutralisations }: StrategyChartProps) => {
  if (laps === 0) return null
  const left = (lap: number) => `${((lap - 1) / laps) * 100}%`
  const width = (from: number, to: number) => `${((to - from + 1) / laps) * 100}%`
  const ticks = Array.from({ length: Math.floor(laps / 10) }, (_, i) => (i + 1) * 10)

  return (
    <figure className='rounded-2xl border border-input bg-card p-4 sm:p-6'>
      <figcaption>
        <span className='label'>ESTRATEGIA DE NEUMÁTICOS</span>
        <span className='mt-1 block text-sm text-muted-foreground'>
          Cada tramo es una tanda; el número es la edad del neumático al montarlo si no era nuevo.
        </span>
      </figcaption>

      <ul className='mt-4 flex flex-wrap gap-x-4 gap-y-2' aria-label='Leyenda de compuestos'>
        {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map((compound) => {
          const info = tyre(compound)
          return (
            <li key={compound} className='flex items-center gap-2'>
              <span className={`inline-flex h-4 w-6 items-center justify-center rounded-sm font-mono text-[10px] font-bold ${TONE[info.tone]}`}>
                {info.letter}
              </span>
              <span className='label normal-case tracking-normal'>{info.name}</span>
            </li>
          )
        })}
        {neutralisations.length > 0 && (
          <li className='flex items-center gap-2'>
            <span className='inline-block h-4 w-6 rounded-sm bg-muted' aria-hidden='true' />
            <span className='label normal-case tracking-normal'>Safety car / VSC / bandera roja</span>
          </li>
        )}
      </ul>

      <div className='mt-5 space-y-1.5'>
        {rows.map((row) => (
          <div key={row.driverNumber} className='flex items-center gap-3'>
            <span className='w-10 shrink-0 text-right font-mono text-xs text-muted-foreground'>
              {row.finishPosition ? `P${row.finishPosition}` : '—'}
            </span>
            <span className='w-10 shrink-0 font-mono text-sm font-bold text-display'>{row.code}</span>
            <div className='relative h-6 flex-1 rounded-sm bg-background'>
              {neutralisations.map((period) => (
                <span
                  key={`${period.kind}-${period.fromLap}`}
                  aria-hidden='true'
                  className='absolute inset-y-0 bg-muted'
                  style={{ left: left(period.fromLap), width: width(period.fromLap, period.toLap) }}
                />
              ))}
              {row.stints.map((stint) => {
                const info = tyre(stint.compound)
                return (
                  <span
                    key={stint.from}
                    title={`${info.name}: vueltas ${stint.from}–${stint.to}${stint.tyreAge ? `, usado (${stint.tyreAge} v.)` : ''}`}
                    className={`absolute inset-y-0.5 flex items-center justify-center overflow-hidden rounded-sm font-mono text-[10px] font-bold ${TONE[info.tone]}`}
                    style={{ left: `calc(${left(stint.from)} + 1px)`, width: `calc(${width(stint.from, stint.to)} - 2px)` }}>
                    <span className='sr-only'>
                      {info.name}, vueltas {stint.from} a {stint.to}
                    </span>
                    <span aria-hidden='true'>
                      {info.letter}
                      {stint.tyreAge ? <sup className='ml-px'>{stint.tyreAge}</sup> : null}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-2 flex gap-3' aria-hidden='true'>
        <span className='w-10 shrink-0' />
        <span className='w-10 shrink-0' />
        <div className='relative h-4 flex-1'>
          {ticks.map((tick) => (
            <span key={tick} className='absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground' style={{ left: left(tick + 0.5) }}>
              V{tick}
            </span>
          ))}
        </div>
      </div>
    </figure>
  )
}

export default StrategyChart
