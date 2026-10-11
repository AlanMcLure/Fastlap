import 'server-only'

import { db } from '@/lib/db'
import { raceStatus, sessionStart } from '@/lib/f1/calendar'
import { getCalendar } from '@/lib/f1/queries'
import {
  assembleReplay, pickRaceSession, type OF1Driver, type OF1Lap, type OF1Location, type OF1Position, type OF1RaceControl,
  type OF1Interval, type OF1Session, type OF1Stint,
} from './assemble'
import { REPLAY_VERSION, type Replay } from './format'
import { openF1 } from './openf1'

/** OpenF1 has car positions from 2023 on. */
export const FIRST_REPLAY_SEASON = 2023
/** Wait this long after the start before building (the race and OpenF1's processing must be done). */
const BUILD_AFTER_START_MS = 4 * 3600 * 1000

export const replayKey = (season: number, round: number) => `replay:v${REPLAY_VERSION}:${season}:${round}`

/** The stored replay of a race, or null when it has not been built. */
export async function getStoredReplay(season: number, round: number): Promise<Replay | null> {
  const row = await db.f1Snapshot.findUnique({ where: { key: replayKey(season, round) } })
  return row ? (row.payload as unknown as Replay) : null
}

export async function hasReplay(season: number, round: number): Promise<boolean> {
  const row = await db.f1Snapshot.findUnique({ where: { key: replayKey(season, round) }, select: { key: true } })
  return row !== null
}

/** The most recent race of the running season that is far enough behind to build, or null. */
export async function latestBuildableRace(now = new Date()): Promise<{ season: number; round: number } | null> {
  const races = await getCalendar('current')
  const done = races.filter(
    (r) => raceStatus(r, now) === 'finished' && now.getTime() >= sessionStart(r.date, r.time).start.getTime() + BUILD_AFTER_START_MS
  )
  const last = done.at(-1)
  return last ? { season: last.season, round: last.round } : null
}

/**
 * Downloads a finished race from OpenF1 (about 27 spaced requests, a minute or two), builds the
 * replay and stores it. RangeError for a race that cannot have one (too old, not run yet).
 */
export async function buildAndStoreReplay(season: number, round: number) {
  if (!Number.isInteger(season) || !Number.isInteger(round) || season < FIRST_REPLAY_SEASON) {
    throw new RangeError(`Solo hay repeticiones desde ${FIRST_REPLAY_SEASON}`)
  }
  const race = (await getCalendar(season)).find((r) => r.round === round)
  if (!race) throw new RangeError('Esa carrera no existe')
  const start = sessionStart(race.date, race.time).start.getTime()
  if (raceStatus(race) !== 'finished' || Date.now() < start + BUILD_AFTER_START_MS) {
    throw new RangeError('La carrera aún no ha terminado (o acaba de terminar): prueba más tarde')
  }

  const sessions = await openF1<OF1Session>('sessions', { year: season, session_name: 'Race' })
  const session = pickRaceSession(sessions, race.date)
  if (!session) throw new RangeError('OpenF1 no tiene esa carrera')
  const key = { session_key: session.session_key }

  const drivers = await openF1<OF1Driver>('drivers', key)
  const locations = new Map<number, OF1Location[]>()
  for (const d of drivers) {
    locations.set(d.driver_number, await openF1<OF1Location>('location', { ...key, driver_number: d.driver_number }))
  }
  const positions = await openF1<OF1Position>('position', key)
  const laps = await openF1<OF1Lap>('laps', key)
  const control = await openF1<OF1RaceControl>('race_control', key)
  const stints = await openF1<OF1Stint>('stints', key)
  const intervals = await openF1<OF1Interval>('intervals', key)

  const replay = assembleReplay({ season, round, name: race.raceName, session, drivers, locations, positions, laps, control, stints, intervals })
  const payload = replay as unknown as never
  await db.f1Snapshot.upsert({
    where: { key: replayKey(season, round) },
    create: { key: replayKey(season, round), payload },
    update: { payload },
  })
  return {
    season,
    round,
    name: race.raceName,
    sessionKey: session.session_key,
    drivers: replay.drivers.length,
    frames: replay.frames,
    bytes: JSON.stringify(replay).length,
  }
}
