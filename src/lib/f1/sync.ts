import {
  getCalendar,
  getConstructorStandings,
  getDriverStandings,
  getDrivers,
  getSeasonResults,
  getSeasonSprintResults,
  isClosedSeason,
} from './queries'

export const FIRST_SYNC_SEASON = 1950

/**
 * Copies everything the dashboard reads about a closed season into the own
 * store. The queries are read-through, so a season that is already stored costs
 * no request to Jolpica and running this twice is harmless.
 */
export async function syncSeason(season: number, now = new Date()) {
  if (!isClosedSeason(season, now) || season < FIRST_SYNC_SEASON) {
    throw new RangeError(`Only closed seasons can be synced: ${season}`)
  }
  const calendar = await getCalendar(season)
  // Sequential on purpose: Jolpica allows ~4 requests per second and 500 per hour.
  await getDriverStandings(season)
  await getConstructorStandings(season)
  const results = await getSeasonResults(season)
  await getSeasonSprintResults(season)
  await getDrivers(season)
  return { season, races: calendar.length, racesWithResults: results.length }
}
