export interface StandingRow {
  id: string
  position: string
  /** Driver code (VER) — drivers only. */
  code?: string
  name: string
  team?: string
  wins: number
  points: number
}

interface StandingsTableProps {
  rows: StandingRow[]
  caption: string
}

const formatPoints = (points: number) => (Number.isInteger(points) ? String(points) : points.toFixed(1))

/** Championship table in the style of a timing tower: tabular numbers, gap to the leader, a bar for the points. */
const StandingsTable = ({ rows, caption }: StandingsTableProps) => {
  const leader = rows[0]?.points ?? 0

  return (
    <div className='overflow-x-auto rounded-2xl border border-input bg-card'>
      <table className='w-full border-collapse text-left tabular-nums'>
        <caption className='sr-only'>{caption}</caption>
        <thead>
          <tr className='label border-b border-border'>
            <th scope='col' className='w-12 px-3 py-3 font-normal sm:w-14 sm:px-4'>POS</th>
            <th scope='col' className='px-2 py-3 font-normal'>{rows[0]?.code ? 'PILOTO' : 'EQUIPO'}</th>
            <th scope='col' className='hidden px-2 py-3 font-normal md:table-cell'>{rows[0]?.code ? 'EQUIPO' : ''}</th>
            <th scope='col' className='hidden w-14 px-2 py-3 text-right font-normal sm:table-cell'>VIC</th>
            <th scope='col' className='hidden w-20 px-2 py-3 text-right font-normal sm:table-cell'>GAP</th>
            <th scope='col' className='w-20 px-4 py-3 text-right font-normal'>PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-3 font-mono text-muted-foreground'>{row.position}</td>
              <td className='px-2 py-3'>
                <div className='flex items-baseline gap-3'>
                  {row.code && <span className='font-mono font-bold tracking-wide text-display'>{row.code}</span>}
                  <span className={row.code ? 'hidden text-foreground sm:inline' : 'text-display'}>{row.name}</span>
                </div>
                <div
                  className='mt-2 h-[3px] rounded-full bg-border'
                  role='presentation'
                  aria-hidden='true'>
                  <div
                    className='h-full rounded-full bg-display'
                    style={{ width: `${leader > 0 ? (row.points / leader) * 100 : 0}%` }}
                  />
                </div>
              </td>
              <td className='hidden px-2 py-3 text-sm text-muted-foreground md:table-cell'>{row.team}</td>
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground sm:table-cell'>{row.wins}</td>
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground sm:table-cell'>
                {index === 0 ? 'LÍDER' : leader === row.points ? '0' : `-${formatPoints(leader - row.points)}`}
              </td>
              <td className='px-4 py-3 text-right font-mono text-lg text-display'>{formatPoints(row.points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StandingsTable
