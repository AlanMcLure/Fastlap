import { driverCode } from '@/lib/f1/format'
import type { Standings } from '@/lib/f1/queries'
import type { ConstructorStanding, DriverStanding } from '@/lib/f1/schemas'

import type { StandingRow } from './StandingsTable'

const position = (s: { position?: number; positionText: string }) =>
  s.position !== undefined ? String(s.position) : s.positionText

/** Rows for the drivers' table, optionally only the first `limit`. */
export function driverRows(standings: Standings<DriverStanding> | null, limit?: number): StandingRow[] {
  return (standings?.standings ?? []).slice(0, limit).map((s) => ({
    id: s.Driver.driverId,
    position: position(s),
    code: driverCode(s.Driver),
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    team: s.Constructors.map((c) => c.name).join(' / '),
    wins: s.wins,
    points: s.points,
  }))
}

export function constructorRows(standings: Standings<ConstructorStanding> | null): StandingRow[] {
  return (standings?.standings ?? []).map((s) => ({
    id: s.Constructor.constructorId,
    position: position(s),
    name: s.Constructor.name,
    wins: s.wins,
    points: s.points,
  }))
}
