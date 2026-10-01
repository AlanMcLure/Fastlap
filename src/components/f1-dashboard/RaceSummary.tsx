import { driverCode } from '@/lib/f1/format'
import type { RaceSummary as Summary } from '@/lib/f1/race'
import type { Result } from '@/lib/f1/schemas'

const Tile = ({ label, result, detail }: { label: string; result?: Result; detail?: string }) => (
  <div className='rounded-xl border border-border bg-card p-4'>
    <p className='label'>{label}</p>
    {result ? (
      <>
        <p className='mt-2 text-lg text-display'>
          <span className='font-mono font-bold tracking-wide'>{driverCode(result.Driver)}</span>{' '}
          <span className='text-foreground'>{result.Driver.familyName}</span>
        </p>
        <p className='label mt-1'>{detail ?? result.Constructor.name}</p>
      </>
    ) : (
      <p className='mt-2 text-muted-foreground'>—</p>
    )}
  </div>
)

/** Winner, who started first and who set the fastest lap. */
const RaceSummary = ({ summary }: { summary: Summary }) => (
  <div className='grid gap-3 sm:grid-cols-3'>
    <Tile label='GANADOR' result={summary.winner} />
    <Tile label='SALIÓ PRIMERO' result={summary.pole} />
    <Tile
      label='VUELTA RÁPIDA'
      result={summary.fastestLap}
      detail={
        summary.fastestLap?.FastestLap
          ? `${summary.fastestLap.FastestLap.Time?.time ?? ''}${summary.fastestLap.FastestLap.lap ? ` · VUELTA ${summary.fastestLap.FastestLap.lap}` : ''}`
          : undefined
      }
    />
  </div>
)

export default RaceSummary
