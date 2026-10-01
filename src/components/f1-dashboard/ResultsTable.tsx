import { driverCode } from '@/lib/f1/format'
import { placesGained } from '@/lib/f1/race'
import type { Result } from '@/lib/f1/schemas'
import ScrollRegion from '@/components/ScrollRegion'

const formatPoints = (points: number) => (Number.isInteger(points) ? String(points) : points.toFixed(1))

const Gain = ({ result }: { result: Result }) => {
  const gained = placesGained(result)
  if (gained === null) return <span className='text-muted-foreground'>–</span>
  if (gained === 0) return <span className='text-muted-foreground'>=</span>
  return (
    <span className={gained > 0 ? 'text-success' : 'text-muted-foreground'}>
      {gained > 0 ? '+' : ''}
      {gained}
    </span>
  )
}

/** Race classification: finishing order, grid, places gained, time or reason for retiring, fastest lap and points. */
const ResultsTable = ({ results, caption }: { results: Result[]; caption: string }) => (
  <ScrollRegion label={caption}>
    <table className='w-full border-collapse text-left tabular-nums'>
      <caption className='sr-only'>{caption}</caption>
      <thead>
        <tr className='label border-b border-border'>
          <th scope='col' className='w-12 px-3 py-3 font-normal sm:w-14 sm:px-4'>POS</th>
          <th scope='col' className='px-2 py-3 font-normal'>PILOTO</th>
          <th scope='col' className='hidden px-2 py-3 font-normal md:table-cell'>EQUIPO</th>
          <th scope='col' className='hidden w-14 px-2 py-3 text-right font-normal sm:table-cell'>SAL</th>
          <th scope='col' className='hidden w-14 px-2 py-3 text-right font-normal sm:table-cell'>+/-</th>
          <th scope='col' className='px-2 py-3 text-right font-normal'>TIEMPO</th>
          <th scope='col' className='w-16 px-3 py-3 text-right font-normal sm:px-4'>PTS</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => {
          const finished = /^\d+$/.test(result.positionText)
          const fastest = result.FastestLap?.rank === 1
          return (
            <tr key={result.Driver.driverId} className='border-b border-border last:border-0'>
              <td className={`px-3 py-3 font-mono sm:px-4 ${finished ? 'text-muted-foreground' : 'italic text-muted-foreground'}`}>
                {result.positionText}
              </td>
              <td className='px-2 py-3'>
                <span className='font-mono font-bold tracking-wide text-display'>{driverCode(result.Driver)}</span>
                <span className='ml-3 hidden text-foreground sm:inline'>
                  {result.Driver.givenName} {result.Driver.familyName}
                </span>
                {fastest && (
                  <span
                    className='label ml-2 rounded-full border border-input px-2 py-0.5 text-display'
                    title={`Vuelta rápida: ${result.FastestLap?.Time?.time ?? ''}`}>
                    VR
                  </span>
                )}
              </td>
              <td className='hidden px-2 py-3 text-sm text-muted-foreground md:table-cell'>{result.Constructor.name}</td>
              <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground sm:table-cell'>
                {result.grid === 0 ? 'PIT' : result.grid}
              </td>
              <td className='hidden px-2 py-3 text-right font-mono sm:table-cell'>
                <Gain result={result} />
              </td>
              <td className='px-2 py-3 text-right font-mono text-sm text-muted-foreground'>
                {result.Time?.time ?? result.status}
              </td>
              <td className='px-3 py-3 text-right font-mono text-lg text-display sm:px-4'>{formatPoints(result.points)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </ScrollRegion>
)

export default ResultsTable
