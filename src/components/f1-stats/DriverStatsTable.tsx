import ScrollRegion from '@/components/ScrollRegion'
import type { DriverSeasonStats } from '@/lib/f1stats/schemas'

interface DriverStatsTableProps {
  rows: DriverSeasonStats[]
  codes: Map<string, string>
  teams: Map<string, string>
  caption: string
}

const fmt = (value: number | null, digits = 1) => (value == null ? '—' : value.toFixed(digits).replace('.', ','))
const points = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ','))

/** Season numbers of every driver, in championship order. The best value of each column is marked. */
const DriverStatsTable = ({ rows, codes, teams, caption }: DriverStatsTableProps) => {
  const best = {
    wins: Math.max(0, ...rows.map((r) => r.wins)),
    podiums: Math.max(0, ...rows.map((r) => r.podiums)),
    poles: Math.max(0, ...rows.map((r) => r.poles)),
    fastestLaps: Math.max(0, ...rows.map((r) => r.fastestLaps)),
    gained: Math.max(0, ...rows.map((r) => r.positionsGained)),
  }
  const cell = (value: number, top: number, className = '') => (
    <td className={`px-2 py-3 text-right font-mono ${value > 0 && value === top ? 'font-bold text-display' : 'text-muted-foreground'} ${className}`}>
      {value}
    </td>
  )

  return (
    <ScrollRegion label={caption}>
      <table className='w-full border-collapse text-left tabular-nums'>
        <caption className='sr-only'>{caption}</caption>
        <thead>
          <tr className='label border-b border-border'>
            <th scope='col' className='w-12 px-4 py-3 font-normal'>POS</th>
            <th scope='col' className='px-2 py-3 font-normal'>PILOTO</th>
            <th scope='col' className='px-2 py-3 text-right font-normal'>PTS</th>
            <th scope='col' className='px-2 py-3 text-right font-normal' title='Victorias'>VIC</th>
            <th scope='col' className='px-2 py-3 text-right font-normal' title='Podios'>POD</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal sm:table-cell' title='Poles'>POLE</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal md:table-cell' title='Vueltas rápidas'>VR</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal md:table-cell' title='Abandonos'>ABD</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal lg:table-cell' title='Posición media de salida'>SALIDA</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal lg:table-cell' title='Posición media de llegada (clasificado)'>LLEGADA</th>
            <th scope='col' className='px-4 py-3 text-right font-normal' title='Posiciones ganadas en total'>+/-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.driverId} className='border-b border-border last:border-0'>
              <td className='px-4 py-3 font-mono text-muted-foreground'>{row.position ?? '—'}</td>
              <td className='px-2 py-3'>
                <span className='font-mono font-bold tracking-wide text-display'>{codes.get(row.driverId) ?? ''}</span>
                <span className='ml-3 hidden text-foreground sm:inline'>{row.driverName}</span>
                <span className='ml-3 hidden text-sm text-muted-foreground xl:inline'>
                  {row.constructorIds.map((id) => teams.get(id) ?? id).join(' / ')}
                </span>
              </td>
              <td className='px-2 py-3 text-right font-mono text-display'>{points(row.points)}</td>
              {cell(row.wins, best.wins)}
              {cell(row.podiums, best.podiums)}
              {cell(row.poles, best.poles, 'hidden sm:table-cell')}
              {cell(row.fastestLaps, best.fastestLaps, 'hidden md:table-cell')}
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground md:table-cell'>{row.retirements}</td>
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground lg:table-cell'>{fmt(row.averageGrid)}</td>
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground lg:table-cell'>{fmt(row.averageFinish)}</td>
              <td className={`px-4 py-3 text-right font-mono ${row.positionsGained > 0 && row.positionsGained === best.gained ? 'font-bold text-display' : 'text-muted-foreground'}`}>
                {row.positionsGained > 0 ? `+${row.positionsGained}` : row.positionsGained}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  )
}

export default DriverStatsTable
