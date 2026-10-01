import { NextResponse } from 'next/server'

import {
  getCalendar,
  getConstructorStandings,
  getDriverStandings,
  getDrivers,
  getSeasonResults,
  getSeasonSprintResults,
  isClosedSeason,
} from '@/lib/f1/queries'

export const dynamic = 'force-dynamic'

const RESOURCES = {
  calendar: getCalendar,
  drivers: getDrivers,
  'driver-standings': (season: number) => getDriverStandings(season),
  'constructor-standings': (season: number) => getConstructorStandings(season),
  results: getSeasonResults,
  sprint: getSeasonSprintResults,
} as const

const ATTRIBUTION = 'Data from Jolpica-F1 (https://github.com/jolpica/jolpica-f1), CC BY-NC-SA 4.0'

/**
 * Read API over the own copy of historical data: `/api/f1/2023/results`.
 * Only closed seasons, so that it never fans out to Jolpica for live data.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ season: string; resource: string }> }) {
  const { season: rawSeason, resource } = await ctx.params
  const season = /^\d{4}$/.test(rawSeason) ? Number(rawSeason) : NaN
  if (!isClosedSeason(season)) {
    return NextResponse.json({ error: 'Solo hay datos históricos de temporadas ya terminadas' }, { status: 404 })
  }
  if (!Object.hasOwn(RESOURCES, resource)) {
    return NextResponse.json({ error: 'Recurso desconocido', resources: Object.keys(RESOURCES) }, { status: 404 })
  }

  try {
    const data = await RESOURCES[resource as keyof typeof RESOURCES](season)
    return NextResponse.json(
      { season, resource, attribution: ATTRIBUTION, data },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
    )
  } catch {
    return NextResponse.json({ error: 'No se han podido obtener los datos' }, { status: 502 })
  }
}
