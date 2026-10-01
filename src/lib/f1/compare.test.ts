import { describe, expect, it } from 'vitest'

import { compareDrivers, headToHead, type CompareInput } from './compare'
import type { DriverEntry, Stats } from './driver'

const stats = (over: Partial<Stats>): Stats => ({
  races: 100, wins: 10, podiums: 30, polePositions: 8, fastestLaps: 5, points: 800, retirements: 12, bestFinish: 1, bestFinishCount: 10, ...over,
})
const input = (s: Partial<Stats>, titles = 0, seasons = 8): CompareInput => ({ stats: stats(s), titles, seasons })

describe('compareDrivers', () => {
  const rows = compareDrivers(input({ wins: 20, retirements: 5, points: 900 }, 2), input({ wins: 10, retirements: 12, points: 1200 }, 0))
  const row = (key: string) => rows.find((r) => r.key === key)!

  it('higher is better for wins and points; lower for unfinished races', () => {
    expect(row('wins').leader).toBe('a')
    expect(row('points').leader).toBe('b')
    expect(row('retirements').leader).toBe('a')
  })
  it('informative rows have no leader; ties have none either', () => {
    expect(row('races').leader).toBeNull()
    expect(row('seasons').leader).toBeNull()
    expect(row('podiums').leader).toBeNull() // 30 vs 30
  })
  it('bar share is the proportion of the pair', () => {
    expect(row('wins').aShare).toBe(67)
    expect(row('titles').aShare).toBe(100)
    expect(compareDrivers(input({ wins: 0 }), input({ wins: 0 })).find((r) => r.key === 'wins')!.aShare).toBe(50)
  })
  it('derived rows: points per race and win rate', () => {
    expect(row('average').a).toBe(9)
    expect(row('winRate').a).toBe(20)
    expect(compareDrivers(input({ races: 0, points: 0, wins: 0 }), input({})).find((r) => r.key === 'average')!.a).toBeNull()
  })
  it('best finish: lower position wins, text shows how many times', () => {
    const r = compareDrivers(input({ bestFinish: 1, bestFinishCount: 12 }), input({ bestFinish: 2, bestFinishCount: 3 })).find((x) => x.key === 'best')!
    expect(r).toMatchObject({ leader: 'a', aText: '1.º (×12)', bText: '2.º (×3)', aShare: 50 })
    expect(compareDrivers(input({ bestFinish: null }), input({})).find((x) => x.key === 'best')!).toMatchObject({ aText: '–', leader: null })
  })
})

const entry = (season: number, round: number, position: number, grid: number, retired = false): DriverEntry => ({
  race: { season, round } as DriverEntry['race'],
  result: { position, positionText: retired ? 'R' : String(position), grid } as DriverEntry['result'],
})

describe('headToHead', () => {
  it('counts only races both took part in', () => {
    const h = headToHead([entry(2020, 1, 1, 2), entry(2020, 2, 3, 1), entry(2021, 1, 5, 5)], [entry(2020, 1, 2, 1), entry(2020, 2, 4, 3)])
    expect(h.shared).toBe(2)
  })
  it('race: better position wins; a classified driver beats one who retired; both retired is a tie', () => {
    const h = headToHead(
      [entry(2020, 1, 1, 1), entry(2020, 2, 8, 5, true), entry(2020, 3, 6, 3), entry(2020, 4, 9, 9, true)],
      [entry(2020, 1, 2, 2), entry(2020, 2, 3, 4), entry(2020, 3, 6, 4, true), entry(2020, 4, 10, 8, true)]
    )
    expect(h).toMatchObject({ shared: 4, raceA: 2, raceB: 1, raceTied: 1 })
  })
  it('grid: lower slot is ahead; pit lane (0) counts as last; equal is a tie', () => {
    const h = headToHead([entry(2020, 1, 1, 1), entry(2020, 2, 1, 0), entry(2020, 3, 1, 5)], [entry(2020, 1, 1, 2), entry(2020, 2, 1, 7), entry(2020, 3, 1, 5)])
    expect(h).toMatchObject({ gridA: 1, gridB: 1, gridTied: 1 })
  })
  it('no shared races', () => {
    expect(headToHead([entry(2020, 1, 1, 1)], [entry(2021, 1, 1, 1)])).toMatchObject({ shared: 0, raceA: 0, raceB: 0 })
  })
})
