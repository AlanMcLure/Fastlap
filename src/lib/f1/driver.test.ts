import { describe, expect, it } from 'vitest'

import { championshipYears, entriesByDriver, seasonLines, statsOf, teamHistory, type DriverEntry } from './driver'
import type { DriverSeason } from './queries'
import type { RaceWithResults } from './schemas'

const circuit = { circuitId: 'c', circuitName: 'C', Location: { lat: 0, long: 0, locality: 'L', country: 'K' } }
const driver = (id: string) => ({ driverId: id, givenName: id, familyName: id.toUpperCase(), dateOfBirth: '2000-01-01', nationality: 'X' })
const team = (id: string) => ({ constructorId: id, name: id.toUpperCase(), nationality: 'X' })

function result(id: string, o: { position?: number; text?: string; grid?: number; points?: number; team?: string; fl?: boolean }) {
  const position = o.position ?? 1
  return {
    position, positionText: o.text ?? String(position), points: o.points ?? 0, Driver: driver(id), Constructor: team(o.team ?? 't1'),
    grid: o.grid ?? position, laps: 50, status: 'Finished', FastestLap: o.fl ? { rank: 1 } : undefined,
  }
}
const race = (season: number, round: number, results: ReturnType<typeof result>[]): RaceWithResults => ({
  season, round, raceName: `R${round}`, Circuit: circuit, date: `${season}-01-01`, Results: results,
})

const races = [
  race(2020, 1, [result('a', { position: 1, grid: 1, points: 25, fl: true }), result('b', { position: 2, grid: 3, points: 18 })]),
  race(2020, 2, [result('a', { position: 3, grid: 2, points: 15 }), result('b', { position: 1, grid: 1, points: 25 })]),
  race(2020, 3, [result('a', { position: 20, text: 'R', grid: 5 }), result('b', { position: 2, grid: 4, points: 18 })]),
  race(2021, 1, [result('a', { position: 1, grid: 4, points: 25, team: 't2' }), result('b', { position: 19, text: 'D', grid: 0 })]),
]
const a = entriesByDriver(races).get('a') as DriverEntry[]
const b = entriesByDriver(races).get('b') as DriverEntry[]

describe('entriesByDriver', () => {
  it('groups every result under its driver', () => {
    expect(a).toHaveLength(4)
    expect(b).toHaveLength(4)
    expect(entriesByDriver([]).size).toBe(0)
  })
})

describe('statsOf', () => {
  it('counts wins, podiums, poles, fastest laps, points and retirements', () => {
    expect(statsOf(a)).toEqual({ races: 4, wins: 2, podiums: 3, polePositions: 1, fastestLaps: 1, points: 65, retirements: 1, bestFinish: 1, bestFinishCount: 2 })
  })

  it('does not count a disqualification as a win, a podium or a finish', () => {
    const s = statsOf(b)
    expect(s.retirements).toBe(1)
    expect(s.wins).toBe(1)
    expect(s.polePositions).toBe(1)
  })

  it('handles an empty career', () => {
    expect(statsOf([])).toMatchObject({ races: 0, wins: 0, bestFinish: null, bestFinishCount: 0, points: 0 })
  })

  it('keeps fractional points exact', () => {
    const half = entriesByDriver([race(1960, 1, [result('x', { points: 4.5 })]), race(1960, 2, [result('x', { points: 0.5 })])]).get('x') as DriverEntry[]
    expect(statsOf(half).points).toBe(5)
  })
})

describe('teamHistory', () => {
  it('lists teams in order of appearance with their seasons and races', () => {
    expect(teamHistory([...a].reverse())).toEqual([
      { id: 't1', name: 'T1', firstSeason: 2020, lastSeason: 2020, races: 3 },
      { id: 't2', name: 'T2', firstSeason: 2021, lastSeason: 2021, races: 1 },
    ])
  })
})

describe('seasonLines', () => {
  const seasons: DriverSeason[] = [
    { season: 2020, round: 3, position: 2, positionText: '2', points: 58, wins: 1, teams: ['T1'] },
    { season: 2021, round: 1, position: 1, positionText: '1', points: 25, wins: 1, teams: ['T2'] },
  ]

  it('gives one line per season, newest first, with the official position', () => {
    const lines = seasonLines(a, seasons)
    expect(lines.map((l) => l.season)).toEqual([2021, 2020])
    expect(lines[1]).toMatchObject({ races: 3, wins: 1, position: 2, officialPoints: 58, teams: ['T1'] })
  })

  it('still works without standings', () => {
    expect(seasonLines(a, [])[0]).toMatchObject({ season: 2021, position: undefined, points: 25 })
  })
})

describe('championshipYears', () => {
  it('lists the seasons finished in first place, not counting the running one', () => {
    const seasons: DriverSeason[] = [
      { season: 2019, round: 20, position: 1, positionText: '1', points: 1, wins: 1, teams: [] },
      { season: 2020, round: 20, position: 2, positionText: '2', points: 1, wins: 1, teams: [] },
      { season: 2026, round: 16, position: 1, positionText: '1', points: 1, wins: 1, teams: [] },
    ]
    expect(championshipYears(seasons, 2026)).toEqual([2019])
  })
})
