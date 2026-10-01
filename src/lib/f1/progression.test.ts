import { describe, expect, it } from 'vitest'

import { pointsProgression } from './progression'
import { mergeRaces } from './queries'
import type { RaceWithResults, RaceWithSprintResults } from './schemas'

const circuit = { circuitId: 'c', circuitName: 'Circuit', Location: { lat: 0, long: 0, locality: 'City', country: 'Country' } }
const driver = (id: string, code: string) => ({ driverId: id, code, givenName: id, familyName: id.toUpperCase(), dateOfBirth: '2000-01-01', nationality: 'X' })
const team = (id: string) => ({ constructorId: id, name: id.toUpperCase(), nationality: 'X' })
const result = (d: string, code: string, t: string, points: number) => ({
  position: 1, positionText: '1', points, Driver: driver(d, code), Constructor: team(t), grid: 1, laps: 50, status: 'Finished',
})
const race = (round: number, name: string, results: ReturnType<typeof result>[]): RaceWithResults => ({
  season: 2025, round, raceName: name, Circuit: circuit, date: '2025-01-01', Results: results,
})
const sprint = (round: number, results: ReturnType<typeof result>[]): RaceWithSprintResults => ({
  season: 2025, round, raceName: 'x', Circuit: circuit, date: '2025-01-01', SprintResults: results,
})

const races = [
  race(2, 'Chinese Grand Prix', [result('ver', 'VER', 'red_bull', 18), result('nor', 'NOR', 'mclaren', 25)]),
  race(1, 'Australian Grand Prix', [result('nor', 'NOR', 'mclaren', 25), result('pia', 'PIA', 'mclaren', 18), result('ver', 'VER', 'red_bull', 15)]),
  race(3, 'Gran Premio de España', [result('pia', 'PIA', 'mclaren', 25)]),
]

describe('pointsProgression', () => {
  it('accumulates points round by round, sorted by round regardless of input order', () => {
    const { rounds, series } = pointsProgression(races, [], 'drivers')
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3])
    const by = Object.fromEntries(series.map((s) => [s.code, s.points]))
    expect(by.NOR).toEqual([25, 50, 50])
    expect(by.VER).toEqual([15, 33, 33])
    expect(by.PIA).toEqual([18, 18, 43]) // missed round 2: keeps its total
  })

  it('sorts the series by final points, highest first', () => {
    const { series } = pointsProgression(races, [], 'drivers')
    expect(series.map((s) => s.code)).toEqual(['NOR', 'PIA', 'VER'])
  })

  it('adds sprint points to the round of the sprint weekend', () => {
    const { series } = pointsProgression(races, [sprint(2, [result('ver', 'VER', 'red_bull', 8)])], 'drivers')
    const ver = series.find((s) => s.code === 'VER')!
    expect(ver.points).toEqual([15, 41, 41])
  })

  it('adds the points of both cars of a team', () => {
    const { series } = pointsProgression(races, [], 'constructors')
    const by = Object.fromEntries(series.map((s) => [s.code, s.points]))
    expect(by.MCLAREN).toEqual([43, 68, 93])
    expect(by.RED_BULL).toEqual([15, 33, 33])
    expect(series[0].code).toBe('MCLAREN')
  })

  it('keeps fractional points exact', () => {
    const half = [race(1, 'A Grand Prix', [result('ver', 'VER', 'red_bull', 12.5)]), race(2, 'B Grand Prix', [result('ver', 'VER', 'red_bull', 0.5)])]
    expect(pointsProgression(half, [], 'drivers').series[0].points).toEqual([12.5, 13])
  })

  it('shortens race names for the axis', () => {
    const { rounds } = pointsProgression(races, [], 'drivers')
    expect(rounds.map((r) => r.label)).toEqual(['Australian', 'Chinese', 'España'])
  })

  it('returns empty series for a season without results', () => {
    expect(pointsProgression([], [], 'drivers')).toEqual({ rounds: [], series: [] })
  })
})

describe('mergeRaces', () => {
  it('joins a race that a page boundary split and keeps rounds ordered', () => {
    const page1 = [race(1, 'A', [result('a', 'AAA', 't', 1)]), race(2, 'B', [result('a', 'AAA', 't', 1), result('b', 'BBB', 't', 2)])]
    const page2 = [race(2, 'B', [result('c', 'CCC', 't', 3)]), race(3, 'C', [result('a', 'AAA', 't', 4)])]
    const merged = mergeRaces([...page1, ...page2], 'Results')
    expect(merged.map((r) => r.round)).toEqual([1, 2, 3])
    expect(merged[1].Results.map((r) => r.Driver.driverId)).toEqual(['a', 'b', 'c'])
  })
})
