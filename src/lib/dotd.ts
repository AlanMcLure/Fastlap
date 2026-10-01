import 'server-only'

import { db } from '@/lib/db'
import { tally } from '@/lib/raceHub'

/** Driver of the Day votes of a race, most voted first. */
export async function dotdTally(season: number, round: number) {
  const groups = await db.driverOfDayVote.groupBy({
    by: ['driverId'],
    where: { season, round },
    _count: { _all: true },
  })
  return tally(groups.map((g) => ({ driverId: g.driverId, votes: g._count._all })))
}
