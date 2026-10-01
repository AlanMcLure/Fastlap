import { describe, expect, it } from 'vitest'

import { emptyResults, escapeLike, foldText, matchDrivers, normalizeQuery, totalResults } from './search'

describe('normalizeQuery', () => {
  it('trims, collapses spaces and rejects short queries', () => {
    expect(normalizeQuery('  max   verstappen ')).toBe('max verstappen')
    expect(normalizeQuery('a')).toBeNull()
    expect(normalizeQuery('   ')).toBeNull()
    expect(normalizeQuery(null)).toBeNull()
    expect(normalizeQuery(undefined)).toBeNull()
  })
  it('cuts very long text', () => {
    expect(normalizeQuery('x'.repeat(200))).toHaveLength(50)
  })
})

describe('foldText', () => {
  it('ignores case and accents', () => {
    expect(foldText('Pérez')).toBe('perez')
    expect(foldText('ÁLVARO Ñandú')).toBe('alvaro nandu')
  })
})

const drivers = [
  { driverId: 'perez', givenName: 'Sergio', familyName: 'Pérez', code: 'PER' },
  { driverId: 'max_verstappen', givenName: 'Max', familyName: 'Verstappen', code: 'VER' },
  { driverId: 'verstappen_jos', givenName: 'Jos', familyName: 'Verstappen' },
  { driverId: 'hamilton', givenName: 'Lewis', familyName: 'Hamilton', code: 'HAM' },
  { driverId: 'peron', givenName: 'Pedro', familyName: 'Peron' },
]

describe('matchDrivers', () => {
  it('matches without accents or case', () => {
    expect(matchDrivers(drivers, 'perez').map((d) => d.driverId)).toEqual(['perez'])
    expect(matchDrivers(drivers, 'PÉREZ').map((d) => d.driverId)).toEqual(['perez'])
  })
  it('matches the full name and the code', () => {
    expect(matchDrivers(drivers, 'lewis ham').map((d) => d.driverId)).toEqual(['hamilton'])
    expect(matchDrivers(drivers, 'ham').map((d) => d.driverId)).toEqual(['hamilton'])
  })
  it('starts-with matches first, then contains; ties by family name', () => {
    const out = matchDrivers(drivers, 'ver').map((d) => d.driverId)
    expect(out.slice(0, 2).sort()).toEqual(['max_verstappen', 'verstappen_jos'])
  })
  it('respects the limit and returns nothing for no match', () => {
    expect(matchDrivers(drivers, 'er', 1)).toHaveLength(1)
    expect(matchDrivers(drivers, 'zzz')).toEqual([])
  })
})

describe('totalResults', () => {
  it('sums every group', () => {
    expect(totalResults(emptyResults())).toBe(0)
    expect(totalResults({ ...emptyResults(), users: [{ username: 'a' }], posts: [{ id: '1', title: 't', community: 'c' }] })).toBe(2)
  })
})

describe('escapeLike', () => {
  it('makes wildcards literal', () => {
    expect(escapeLike('100%_ok\\')).toBe('100\\%\\_ok\\\\')
    expect(escapeLike('normal')).toBe('normal')
  })
})
