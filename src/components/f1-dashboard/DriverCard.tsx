import Link from 'next/link'

import type { Stats } from '@/lib/f1/driver'
import { driverCode } from '@/lib/f1/format'
import type { Driver } from '@/lib/f1/schemas'

interface DriverCardProps {
  driver: Driver
  team?: string
  /** Season numbers; missing when the results could not be loaded. */
  stats?: Pick<Stats, 'points' | 'wins' | 'podiums'>
}

/** A driver of a season: number, name, team and the season's numbers. */
const DriverCard = ({ driver, team, stats }: DriverCardProps) => (
  <Link
    href={`/f1-dashboard/piloto/${driver.driverId}`}
    className='group flex h-full flex-col justify-between gap-6 rounded-xl border border-border bg-card p-5 transition-colors hover:border-display'>
    <div>
      <div className='flex items-center justify-between gap-2'>
        <span className='label'>{driver.permanentNumber ? `#${driver.permanentNumber}` : '—'}</span>
        <span className='font-mono text-sm font-bold tracking-wide text-display'>{driverCode(driver)}</span>
      </div>
      <p className='mt-4 text-sm text-muted-foreground'>{driver.givenName}</p>
      <h3 className='text-xl leading-tight text-display'>{driver.familyName}</h3>
      <p className='label mt-3'>{[driver.nationality, team].filter(Boolean).join(' · ')}</p>
    </div>

    {stats && (
      <dl className='grid grid-cols-3 gap-2 border-t border-border pt-4 text-center tabular-nums'>
        {[
          ['PTS', stats.points],
          ['VIC', stats.wins],
          ['POD', stats.podiums],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className='font-mono text-lg text-display'>{value}</dd>
            <dt className='label'>{label}</dt>
          </div>
        ))}
      </dl>
    )}
  </Link>
)

export default DriverCard
