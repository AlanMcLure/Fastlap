import { describe, expect, it } from 'vitest'

import { parseCommentSort, sessionState, sortComments } from './postPage'

const at = (iso: string) => new Date(iso)

describe('parseCommentSort', () => {
  it('reads the query value', () => {
    expect(parseCommentSort('mejores', true)).toBe('top')
    expect(parseCommentSort('nuevos', false)).toBe('new')
  })
  it('defaults to best, or newest in race threads', () => {
    expect(parseCommentSort(undefined, false)).toBe('top')
    expect(parseCommentSort('raro', true)).toBe('new')
  })
})

describe('sortComments', () => {
  const items = [
    { id: 'a', score: 1, createdAt: at('2026-01-01T10:00:00Z') },
    { id: 'b', score: 5, createdAt: at('2026-01-01T11:00:00Z') },
    { id: 'c', score: 1, createdAt: at('2026-01-01T09:00:00Z') },
  ]
  it('puts the highest score first, ties by the oldest', () => {
    expect(sortComments(items, 'top').map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })
  it('puts the newest first', () => {
    expect(sortComments(items, 'new').map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })
  it('does not reorder the input', () => {
    sortComments(items, 'top')
    expect(items.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('sessionState', () => {
  const quali = { key: 'Qualifying' as const, start: at('2026-10-03T08:00:00Z') }
  const race = { key: 'Race' as const, start: at('2026-10-04T07:00:00Z') }
  it('is upcoming before the start', () => {
    expect(sessionState(quali, at('2026-10-03T07:59:00Z'))).toBe('upcoming')
  })
  it('is live for a while after the start, longer for the race', () => {
    expect(sessionState(quali, at('2026-10-03T09:00:00Z'))).toBe('live')
    expect(sessionState(quali, at('2026-10-03T09:30:00Z'))).toBe('done')
    expect(sessionState(race, at('2026-10-04T09:30:00Z'))).toBe('live')
    expect(sessionState(race, at('2026-10-04T10:00:00Z'))).toBe('done')
  })
})
