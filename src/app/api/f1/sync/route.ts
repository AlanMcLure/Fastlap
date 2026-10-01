import { NextResponse } from 'next/server'

import { syncSeason } from '@/lib/f1/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_SEASONS_PER_CALL = 3

/**
 * Backfills the own copy of finished seasons. Protected by `CRON_SECRET`
 * (`Authorization: Bearer <secret>`); without the variable the route is off.
 * `?season=2023` syncs one season, `?from=2018&to=2020` a range (max 3 per call,
 * to stay under Jolpica's hourly limit); by default the last closed season.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const params = new URL(req.url).searchParams
  const last = new Date().getUTCFullYear() - 1
  const single = params.get('season')
  const from = Number(single ?? params.get('from') ?? last)
  const to = Number(single ?? params.get('to') ?? from)
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from + 1 > MAX_SEASONS_PER_CALL) {
    return NextResponse.json({ error: `Rango no válido (máximo ${MAX_SEASONS_PER_CALL} temporadas)` }, { status: 400 })
  }

  const synced = []
  try {
    for (let season = from; season <= to; season++) synced.push(await syncSeason(season))
  } catch (error) {
    const message = error instanceof RangeError ? error.message : 'La sincronización ha fallado'
    return NextResponse.json({ error: message, synced }, { status: error instanceof RangeError ? 400 : 502 })
  }
  return NextResponse.json({ synced })
}
