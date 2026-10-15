import ScrollRegion from '@/components/ScrollRegion'
import { formatDelta, formatLapTime, sessionBestSectors } from '@/lib/f1stats/race'
import type { BestLap } from '@/lib/f1stats/schemas'

interface BestLapsTableProps {
  rows: BestLap[]
  caption: string
}

/**
 * Best lap of every driver with the gap to the fastest, best sectors (the session best is marked) and the
 * ideal lap made of the driver's best sectors.
 */
const BestLapsTable = ({ rows, caption }: BestLapsTableProps) => {
  const best = sessionBestSectors(rows)
  const sector = (value: number | null, index: number) => {
    const isBest = value != null && value === best[index]
    return (
      <td className={`hidden px-2 py-3 text-right font-mono md:table-cell ${isBest ? 'font-bold text-display' : 'text-muted-foreground'}`}>
        {value == null ? '—' : value.toFixed(3)}
        {isBest && (
          <>
            <span aria-hidden='true'> ◆</span>
            <span className='sr-only'> (mejor de la sesión)</span>
          </>
        )}
      </td>
    )
  }

  return (
    <ScrollRegion label={caption}>
      <table className='w-full border-collapse text-left tabular-nums'>
        <caption className='sr-only'>{caption}</caption>
        <thead>
          <tr className='label border-b border-border'>
            <th scope='col' className='w-12 px-4 py-3 font-normal'>POS</th>
            <th scope='col' className='px-2 py-3 font-normal'>PILOTO</th>
            <th scope='col' className='px-2 py-3 text-right font-normal'>MEJOR VUELTA</th>
            <th scope='col' className='px-2 py-3 text-right font-normal'>DIF.</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal md:table-cell'>S1</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal md:table-cell'>S2</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal md:table-cell'>S3</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal sm:table-cell'>IDEAL</th>
            <th scope='col' className='hidden px-2 py-3 text-right font-normal lg:table-cell'>KM/H</th>
            <th scope='col' className='px-4 py-3 text-right font-normal'>VUELTAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.driverNumber} className='border-b border-border last:border-0'>
              <td className='px-4 py-3 font-mono text-muted-foreground'>{row.position ?? '—'}</td>
              <td className='px-2 py-3'>
                <span className='font-mono font-bold tracking-wide text-display'>{row.nameAcronym}</span>
                <span className='ml-3 hidden text-sm text-muted-foreground sm:inline'>{row.teamName}</span>
              </td>
              <td className='px-2 py-3 text-right font-mono text-display'>{formatLapTime(row.bestLap)}</td>
              <td className='px-2 py-3 text-right font-mono text-muted-foreground'>
                {row.position === 1 ? '—' : formatDelta(row.gap)}
              </td>
              {sector(row.bestSector1, 0)}
              {sector(row.bestSector2, 1)}
              {sector(row.bestSector3, 2)}
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground sm:table-cell'>
                {formatLapTime(row.idealLap)}
              </td>
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground lg:table-cell'>{row.topSpeed ?? '—'}</td>
              <td className='px-4 py-3 text-right font-mono text-muted-foreground'>{row.laps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  )
}

export default BestLapsTable
