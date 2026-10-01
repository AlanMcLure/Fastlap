import 'server-only'

import { getCalendar, getSeasonResults, getSeasonSprintResults } from '@/lib/f1/queries'
import { outcomeFromResults, outcomeKey, type Outcome } from '@/lib/league'

/** Season a new league is created for: the one the calendar calls current. */
export async function currentSeason(): Promise<number> {
  try {
    const races = await getCalendar('current')
    if (races[0]) return races[0].season
  } catch {
    // fall back to the clock
  }
  return new Date().getUTCFullYear()
}

/** Outcomes (podium + fastest lap) of every race and sprint already run in a season, keyed by `outcomeKey`. */
export async function loadOutcomes(season: number): Promise<Map<string, Outcome>> {
  const [races, sprints] = await Promise.all([getSeasonResults(season), getSeasonSprintResults(season)])
  const outcomes = new Map<string, Outcome>()
  for (const race of races) {
    const o = outcomeFromResults(race.Results)
    if (o) outcomes.set(outcomeKey(race.round, 'RACE'), o)
  }
  for (const race of sprints) {
    const o = outcomeFromResults(race.SprintResults)
    if (o) outcomes.set(outcomeKey(race.round, 'SPRINT'), { ...o, fastestLap: null })
  }
  return outcomes
}
