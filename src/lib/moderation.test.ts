import { describe, expect, it } from 'vitest'

import { ReportValidator, ResolveValidator, groupReports, reasonLabel, removedBody, targetKey } from './moderation'

const row = (key: string, reason: 'SPAM' | 'ABUSE' | 'OFF_TOPIC' | 'OTHER', at: string, details?: string) => ({
  targetKey: key, reason, details, createdAt: new Date(at),
})

describe('targetKey', () => {
  it('namespaces posts and comments', () => {
    expect(targetKey('POST', 'abc')).toBe('post:abc')
    expect(targetKey('COMMENT', 'abc')).toBe('comment:abc')
  })
})

describe('validators', () => {
  it('accepts a report and trims the details', () => {
    expect(ReportValidator.parse({ type: 'POST', id: 'x', reason: 'SPAM', details: '  hola  ' }).details).toBe('hola')
  })
  it('rejects unknown reasons, empty ids and long details', () => {
    expect(ReportValidator.safeParse({ type: 'POST', id: 'x', reason: 'NOPE' }).success).toBe(false)
    expect(ReportValidator.safeParse({ type: 'POST', id: '', reason: 'SPAM' }).success).toBe(false)
    expect(ReportValidator.safeParse({ type: 'POST', id: 'x', reason: 'SPAM', details: 'a'.repeat(301) }).success).toBe(false)
    expect(ResolveValidator.safeParse({ type: 'POST', id: 'x', action: 'ban' }).success).toBe(false)
  })
  it('reasonLabel', () => expect(reasonLabel('ABUSE')).toBe('Insultos o acoso'))
})

describe('groupReports', () => {
  const rows = [
    row('post:a', 'SPAM', '2026-03-01T10:00:00Z', 'vende cosas'),
    row('comment:b', 'ABUSE', '2026-03-01T09:00:00Z'),
    row('post:a', 'SPAM', '2026-03-02T10:00:00Z'),
    row('post:a', 'OTHER', '2026-03-03T10:00:00Z', ' ocurre algo '),
    row('comment:c', 'OFF_TOPIC', '2026-02-28T10:00:00Z'),
  ]
  const groups = groupReports(rows)

  it('groups by target, most reported first, then oldest', () => {
    expect(groups.map((g) => [g.targetKey, g.count])).toEqual([['post:a', 3], ['comment:c', 1], ['comment:b', 1]])
  })
  it('parses the type and id', () => {
    expect(groups[0]).toMatchObject({ type: 'POST', id: 'a' })
    expect(groups[1]).toMatchObject({ type: 'COMMENT', id: 'c' })
  })
  it('tallies reasons and collects non-empty details, newest first', () => {
    expect(groups[0].reasons).toEqual([{ reason: 'SPAM', count: 2 }, { reason: 'OTHER', count: 1 }])
    expect(groups[0].details).toEqual(['ocurre algo', 'vende cosas'])
  })
  it('first and last report dates', () => {
    expect(groups[0].firstReportedAt.toISOString()).toBe('2026-03-01T10:00:00.000Z')
    expect(groups[0].lastReportedAt.toISOString()).toBe('2026-03-03T10:00:00.000Z')
  })
  it('empty input', () => expect(groupReports([])).toEqual([]))
})

describe('removedBody', () => {
  it('names the kind of content', () => {
    expect(removedBody('POST', 'Hola')).toContain('tu publicación «Hola»')
    expect(removedBody('COMMENT', 'Hola')).toContain('tu comentario «Hola»')
  })
})
