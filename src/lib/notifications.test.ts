import { describe, expect, it } from 'vitest'

import {
  closingBody, closingSoon, commentNotifications, excerpt, recentRace, scoredBody,
} from './notifications'

const base = {
  actorId: 'a', actorName: 'ana', commentText: 'Hola   mundo', postId: 'p1', postTitle: 'Estrategia',
  postAuthorId: 'b', community: 'formula1',
}

describe('excerpt', () => {
  it('collapses whitespace and truncates with an ellipsis', () => {
    expect(excerpt('  a   b \n c ')).toBe('a b c')
    expect(excerpt('x'.repeat(100), 10)).toBe('xxxxxxxxx…')
  })
})

describe('commentNotifications', () => {
  it('notifies the post author of a top-level comment, linking to the post', () => {
    const [n, ...rest] = commentNotifications(base)
    expect(rest).toEqual([])
    expect(n).toMatchObject({ userId: 'b', type: 'POST_COMMENT', href: '/r/formula1/post/p1' })
    expect(n.body).toContain('ana')
    expect(n.body).toContain('«Hola mundo»')
  })
  it('notifies the replied-to author and the post author, as different notifications', () => {
    const list = commentNotifications({ ...base, parentAuthorId: 'c' })
    expect(list.map((n) => [n.userId, n.type])).toEqual([['c', 'COMMENT_REPLY'], ['b', 'POST_COMMENT']])
  })
  it('does not notify twice the same person (reply to the post author)', () => {
    const list = commentNotifications({ ...base, parentAuthorId: 'b' })
    expect(list.map((n) => [n.userId, n.type])).toEqual([['b', 'COMMENT_REPLY']])
  })
  it('never notifies the actor', () => {
    expect(commentNotifications({ ...base, postAuthorId: 'a' })).toEqual([])
    expect(commentNotifications({ ...base, postAuthorId: 'a', parentAuthorId: 'a' })).toEqual([])
  })
})

describe('closing and scores', () => {
  const now = new Date('2026-03-20T10:00:00Z')
  it('closingSoon: only in the future and within 24 h', () => {
    expect(closingSoon(new Date('2026-03-21T09:59:00Z'), now)).toBe(true)
    expect(closingSoon(new Date('2026-03-21T10:01:00Z'), now)).toBe(false)
    expect(closingSoon(new Date('2026-03-20T09:59:00Z'), now)).toBe(false)
  })
  it('texts', () => {
    expect(closingBody('formula1', 'GP de China', 'RACE', new Date('2026-03-20T13:10:00Z'), now)).toBe(
      'r/formula1: se cierran los pronósticos de la carrera del GP de China en 3 horas y aún no has pronosticado.')
    expect(closingBody('formula1', 'GP de China', 'SPRINT', new Date('2026-03-20T10:20:00Z'), now)).toContain('en 1 hora ')
    expect(scoredBody('formula1', 'GP de China', 'RACE', 15)).toBe('r/formula1: tu pronóstico de la carrera del GP de China: 15 puntos.')
    expect(scoredBody('formula1', 'GP de China', 'SPRINT', 1)).toContain('1 punto.')
  })
  it('recentRace: only the last 14 days', () => {
    expect(recentRace('2026-03-10', now)).toBe(true)
    expect(recentRace('2026-02-01', now)).toBe(false)
    expect(recentRace('2026-03-25', now)).toBe(false)
  })
})
