import { describe, expect, it } from 'vitest'

import type { Result } from '@/lib/f1/schemas'
import { cardFileName, fit, leaderboardRows, podiumRows } from './shareCards'

const r = (id: string, position: number, extra: Partial<Result> = {}): Result =>
  ({
    position, positionText: String(position),
    Driver: { driverId: id, givenName: id.toUpperCase(), familyName: 'X' },
    Constructor: { name: `Team ${id}` },
    ...extra,
  }) as unknown as Result

describe('podiumRows', () => {
  it('top three by position plus the fastest lap', () => {
    const rows = podiumRows([r('c', 3), r('a', 1), r('b', 2), r('d', 4, { FastestLap: { rank: 1, Time: { time: '1:20.1' } } as Result['FastestLap'] })])
    expect(rows.map((x) => [x.rank, x.label])).toEqual([['1', 'A X'], ['2', 'B X'], ['3', 'C X'], ['VR', 'D X']])
    expect(rows[3].detail).toBe('1:20.1')
    expect(rows[0].detail).toBe('Team a')
  })
  it('skips retired drivers and has no fastest-lap row without a podium', () => {
    const rows = podiumRows([r('a', 1), { ...r('b', 2), positionText: 'R' }, r('c', 3)])
    expect(rows.map((x) => x.rank)).toEqual(['1', '3'])
    expect(podiumRows([{ ...r('a', 1), positionText: 'R', FastestLap: { rank: 1 } as Result['FastestLap'] }])).toEqual([])
  })
  it('no fastest lap row when the data lacks it', () => {
    expect(podiumRows([r('a', 1), r('b', 2), r('c', 3)])).toHaveLength(3)
  })
})

describe('leaderboardRows', () => {
  it('limits to the top and pluralises points', () => {
    const board = [1, 2, 3, 4].map((i) => ({ userId: `u${i}`, rank: i, total: i === 1 ? 1 : 10 - i, exact: 0, scored: 1 }))
    const rows = leaderboardRows(board, new Map([['u1', 'ana']]))
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({ rank: '1', label: 'ana', detail: '1 punto' })
    expect(rows[1]).toMatchObject({ label: 'usuario', detail: '8 puntos' })
  })
})

describe('fit', () => {
  it('keeps short text and cuts long text at a word', () => {
    expect(fit('hola  mundo', 30)).toBe('hola mundo')
    expect(fit('uno dos tres cuatro cinco seis', 20)).toBe('uno dos tres cuatro…')
    expect(fit('x'.repeat(50), 10)).toHaveLength(10)
  })
})

describe('cardFileName', () => {
  it('is a safe lower-case ascii name', () => {
    expect(cardFileName('GP de España', 2026)).toBe('fastlap-gp-de-espana-2026.png')
    expect(cardFileName('???')).toBe('fastlap-tarjeta.png')
  })
})
