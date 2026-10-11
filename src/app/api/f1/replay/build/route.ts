import { NextResponse } from 'next/server'

import { OpenF1LockedError } from '@/lib/replay/openf1'
import { buildAndStoreReplay, hasReplay, latestBuildableRace } from '@/lib/replay/replays'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Builds and stores the replay of a finished race from OpenF1: `?season=2025&round=9`. Without
 * parameters (the daily cron) it builds the latest finished race, unless it is already stored.
 * Protected by `CRON_SECRET` (`Authorization: Bearer <secret>`); without the variable the route is off.
 * Takes a minute or two (OpenF1's free tier allows 30 requests a minute).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('No autorizado', { status: 401 })
  }
  const params = new URL(req.url).searchParams
  try {
    let season = Number(params.get('season'))
    let round = Number(params.get('round'))
    if (!params.has('season')) {
      const latest = await latestBuildableRace()
      if (!latest) return NextResponse.json({ skipped: 'No hay ninguna carrera terminada que construir' })
      if (await hasReplay(latest.season, latest.round)) return NextResponse.json({ skipped: 'Ya construida', ...latest })
      ;({ season, round } = latest)
    }
    return NextResponse.json(await buildAndStoreReplay(season, round))
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ error: error.message }, { status: 400 })
    if (error instanceof OpenF1LockedError) return NextResponse.json({ error: error.message }, { status: 503 })
    console.error('Replay build failed', error)
    return NextResponse.json({ error: 'No se ha podido construir la repetición' }, { status: 502 })
  }
}
