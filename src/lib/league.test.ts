import { describe, expect, it } from 'vitest'

import type { Race, Result } from '@/lib/f1/schemas'
import {
  DEFAULT_RULES,
  buildLeaderboard,
  outcomeFromResults,
  outcomeKey,
  pickProblem,
  predictionDeadline,
  scorePrediction,
  type Outcome,
  type PredictionRow,
} from './league'

const result = (id: string, position: number, extra: Partial<Result> = {}) =>
  ({ position, positionText: String(position), Driver: { driverId: id }, ...extra }) as unknown as Result

const outcome: Outcome = { podium: ['ver', 'nor', 'lec'], fastestLap: 'ham' }

describe('outcomeFromResults', () => {
  it('takes the podium by position and the fastest lap by rank', () => {
    const results = [result('nor', 2), result('ver', 1), result('lec', 3), result('ham', 4, { FastestLap: { rank: 1 } })]
    expect(outcomeFromResults(results)).toEqual({ podium: ['ver', 'nor', 'lec'], fastestLap: 'ham' })
  })
  it('ignores retired drivers (non-numeric position) and returns null without a podium', () => {
    expect(outcomeFromResults([result('a', 1), result('b', 2), { ...result('c', 3), positionText: 'R' }])).toBeNull()
  })
  it('has no fastest lap when the data lacks it (sprints)', () => {
    expect(outcomeFromResults([result('a', 1), result('b', 2), result('c', 3)])?.fastestLap).toBeNull()
  })
})

describe('scorePrediction', () => {
  it('perfect race guess: 3 exact + fastest lap', () => {
    expect(scorePrediction({ p1: 'ver', p2: 'nor', p3: 'lec', fastestLap: 'ham' }, outcome, DEFAULT_RULES, 'RACE')).toEqual({
      total: 18, exact: 3, podium: 15, fastestLap: 3,
    })
  })
  it('drivers on the podium in another place score the lower points', () => {
    const s = scorePrediction({ p1: 'nor', p2: 'ver', p3: 'lec' }, outcome, DEFAULT_RULES, 'RACE')
    expect(s).toMatchObject({ total: 9, exact: 1 })
  })
  it('a driver outside the podium scores nothing', () => {
    expect(scorePrediction({ p1: 'a', p2: 'b', p3: 'c' }, outcome, DEFAULT_RULES, 'RACE').total).toBe(0)
  })
  it('the fastest lap does not count in a sprint', () => {
    expect(scorePrediction({ p1: 'ver', p2: 'nor', p3: 'lec', fastestLap: 'ham' }, outcome, DEFAULT_RULES, 'SPRINT').fastestLap).toBe(0)
  })
  it('uses the league rules', () => {
    const rules = { ...DEFAULT_RULES, exactPoints: 10, presentPoints: 0 }
    expect(scorePrediction({ p1: 'ver', p2: 'lec', p3: 'nor' }, outcome, rules, 'SPRINT').total).toBe(10)
  })
})

describe('predictionDeadline', () => {
  const race = {
    date: '2025-03-23', time: '07:00:00Z',
    Qualifying: { date: '2025-03-22', time: '07:00:00Z' },
  } as unknown as Race
  it('races lock at qualifying, or at the race without it', () => {
    expect(predictionDeadline(race, 'RACE')?.toISOString()).toBe('2025-03-22T07:00:00.000Z')
    expect(predictionDeadline({ date: '2025-03-23', time: '07:00:00Z' } as Race, 'RACE')?.toISOString()).toBe('2025-03-23T07:00:00.000Z')
  })
  it('sprints lock at sprint qualifying; null when there is no sprint', () => {
    expect(predictionDeadline(race, 'SPRINT')).toBeNull()
    const sprint = { ...race, SprintQualifying: { date: '2025-03-21', time: '07:30:00Z' } } as unknown as Race
    expect(predictionDeadline(sprint, 'SPRINT')?.toISOString()).toBe('2025-03-21T07:30:00.000Z')
  })
})

describe('pickProblem', () => {
  const drivers = new Set(['ver', 'nor', 'lec', 'ham'])
  it('accepts a valid pick', () => expect(pickProblem({ p1: 'ver', p2: 'nor', p3: 'lec', fastestLap: 'ham' }, drivers, 'RACE')).toBeNull())
  it('rejects repeated drivers', () => expect(pickProblem({ p1: 'ver', p2: 'ver', p3: 'lec' }, drivers, 'RACE')).not.toBeNull())
  it('rejects unknown drivers, also as fastest lap', () => {
    expect(pickProblem({ p1: 'ver', p2: 'nor', p3: 'xxx' }, drivers, 'RACE')).not.toBeNull()
    expect(pickProblem({ p1: 'ver', p2: 'nor', p3: 'lec', fastestLap: 'xxx' }, drivers, 'RACE')).not.toBeNull()
  })
  it('rejects a fastest lap guess in a sprint', () => {
    expect(pickProblem({ p1: 'ver', p2: 'nor', p3: 'lec', fastestLap: 'ham' }, drivers, 'SPRINT')).not.toBeNull()
  })
})

describe('buildLeaderboard', () => {
  const row = (userId: string, round: number, p: [string, string, string]): PredictionRow => ({
    userId, round, kind: 'RACE', pick: { p1: p[0], p2: p[1], p3: p[2] },
  })
  const outcomes = new Map([[outcomeKey(1, 'RACE'), outcome]])

  it('sums scored predictions and ignores races without an outcome', () => {
    const board = buildLeaderboard(
      [row('a', 1, ['ver', 'nor', 'lec']), row('a', 2, ['ver', 'nor', 'lec']), row('b', 1, ['lec', 'nor', 'ver'])],
      outcomes,
      DEFAULT_RULES
    )
    expect(board.map((e) => [e.userId, e.total, e.scored, e.rank])).toEqual([['a', 15, 1, 1], ['b', 9, 1, 2]])
  })
  it('shares the rank on a full tie and skips the next one', () => {
    const board = buildLeaderboard(
      [row('a', 1, ['ver', 'nor', 'lec']), row('b', 1, ['ver', 'nor', 'lec']), row('c', 1, ['x', 'y', 'z'])],
      outcomes,
      DEFAULT_RULES
    )
    expect(board.map((e) => e.rank)).toEqual([1, 1, 3])
  })
  it('breaks a points tie on exact places', () => {
    const rules = { ...DEFAULT_RULES, exactPoints: 2, presentPoints: 2 }
    const board = buildLeaderboard(
      [row('a', 1, ['lec', 'ver', 'nor']), row('b', 1, ['ver', 'lec', 'nor'])],
      outcomes,
      rules
    )
    expect(board.map((e) => [e.userId, e.rank])).toEqual([['b', 1], ['a', 2]])
  })
  it('lists users with no scored prediction yet, at zero', () => {
    expect(buildLeaderboard([row('a', 2, ['ver', 'nor', 'lec'])], outcomes, DEFAULT_RULES)).toEqual([
      { userId: 'a', rank: 1, total: 0, exact: 0, scored: 0 },
    ])
  })
})
