import 'server-only'

import { getDriverStandings } from '@/lib/f1/queries'
import { buildPool, type GameDriver } from '@/lib/games/driverGuess'

/** Fewer entries than this means the season has barely started: use the previous one. */
const MIN_POOL = 10

export interface GamePool {
  season: number
  pool: GameDriver[]
}

/**
 * The drivers of the latest season with a real grid in its standings (the running one once it has
 * started, otherwise the previous one). Null when the F1 data cannot be loaded.
 */
export async function loadGamePool(now = new Date()): Promise<GamePool | null> {
  const current = await getDriverStandings('current')
  if (current && current.standings.length >= MIN_POOL) {
    return { season: current.season, pool: buildPool(current.standings) }
  }
  const previous = await getDriverStandings((current?.season ?? now.getUTCFullYear()) - 1)
  if (!previous || previous.standings.length === 0) return null
  return { season: previous.season, pool: buildPool(previous.standings) }
}
