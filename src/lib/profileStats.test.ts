import { describe, expect, it } from 'vitest'

import { outcomeKey, type Outcome, type PredictionKind } from './league'
import { champions, computeUserStats, firstPredictionPerRace, leaderboardOf, type StoredPrediction } from './profileStats'

const outcome: Outcome = { podium: ['ver', 'nor', 'lec'], fastestLap: 'ham' }
const outcomes = new Map<string, Outcome>([[outcomeKey(1, 'RACE'), outcome], [outcomeKey(2, 'RACE'), outcome], [outcomeKey(3, 'RACE'), outcome]])

const p = (userId: string, round: number, picks: [string, string, string], at = '2026-03-01T00:00:00Z', leagueId = 'L1', kind: PredictionKind = 'RACE'): StoredPrediction => ({
  userId, leagueId, round, kind, pick: { p1: picks[0], p2: picks[1], p3: picks[2] }, createdAt: new Date(at),
})

describe('firstPredictionPerRace', () => {
  it('keeps the earliest prediction of each user and race, whatever the league', () => {
    const rows = [
      p('a', 1, ['x', 'y', 'z'], '2026-03-02T00:00:00Z', 'L2'),
      p('a', 1, ['ver', 'nor', 'lec'], '2026-03-01T00:00:00Z', 'L1'),
      p('b', 1, ['x', 'y', 'z']),
    ]
    const out = firstPredictionPerRace(rows)
    expect(out).toHaveLength(2)
    expect(out.find((r) => r.userId === 'a')?.leagueId).toBe('L1')
  })
  it('treats race and sprint of the same round as different', () => {
    expect(firstPredictionPerRace([p('a', 1, ['x', 'y', 'z']), p('a', 1, ['x', 'y', 'z'], undefined, 'L1', 'SPRINT')])).toHaveLength(2)
  })
})

describe('computeUserStats', () => {
  it('sums points, exact places and perfect podiums; best race and average', () => {
    const rows = [p('a', 1, ['ver', 'nor', 'lec']), p('a', 2, ['nor', 'ver', 'lec']), p('a', 3, ['x', 'y', 'z'])]
    expect(computeUserStats(rows, outcomes)).toEqual({
      predictions: 3, scored: 3, points: 15 + 9 + 0, exact: 3 + 1 + 0, perfect: 1,
      bestRace: { round: 1, kind: 'RACE', points: 15 }, streak: 0, average: 8,
    })
  })
  it('ignores races without an outcome', () => {
    const stats = computeUserStats([p('a', 1, ['ver', 'nor', 'lec']), p('a', 9, ['ver', 'nor', 'lec'])], outcomes)
    expect(stats).toMatchObject({ predictions: 2, scored: 1, points: 15 })
  })
  it('streak counts the latest consecutive scoring predictions', () => {
    const rows = [p('a', 1, ['x', 'y', 'z']), p('a', 2, ['ver', 'nor', 'lec']), p('a', 3, ['ver', 'x', 'y'])]
    expect(computeUserStats(rows, outcomes).streak).toBe(2)
  })
  it('no predictions', () => {
    expect(computeUserStats([], outcomes)).toEqual({
      predictions: 0, scored: 0, points: 0, exact: 0, perfect: 0, bestRace: null, streak: 0, average: 0,
    })
  })
})

describe('leaderboard and champions', () => {
  const rows = [p('a', 1, ['ver', 'nor', 'lec']), p('b', 1, ['nor', 'ver', 'lec']), p('c', 1, ['x', 'y', 'z'])]
  it('uses the global rules', () => {
    expect(leaderboardOf(rows, outcomes).map((e) => [e.userId, e.total, e.rank])).toEqual([['a', 15, 1], ['b', 9, 2], ['c', 0, 3]])
  })
  it('the champion is rank 1 with points; a table of zeros has none', () => {
    expect(champions(leaderboardOf(rows, outcomes)).map((e) => e.userId)).toEqual(['a'])
    expect(champions(leaderboardOf([p('c', 1, ['x', 'y', 'z'])], outcomes))).toEqual([])
  })
  it('co-champions share the title', () => {
    expect(champions(leaderboardOf([p('a', 1, ['ver', 'nor', 'lec']), p('b', 1, ['ver', 'nor', 'lec'])], outcomes)).map((e) => e.userId)).toEqual(['a', 'b'])
  })
})
