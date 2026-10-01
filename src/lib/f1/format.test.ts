import { describe, expect, it } from 'vitest'

import { formatRaceDate, formatRaceDay, formatSessionTime } from './format'

describe('format', () => {
  it('formats a race date in Spanish without depending on the server time zone', () => {
    expect(formatRaceDate('2025-03-16')).toBe('16 mar 2025')
    expect(formatRaceDay('2025-09-07')).toBe('7 sept')
  })

  it('formats a session time in the requested time zone', () => {
    const start = new Date('2025-03-16T04:00:00Z')
    expect(formatSessionTime(start, 'UTC')).toContain('04:00')
    expect(formatSessionTime(start, 'Europe/Madrid')).toContain('05:00')
    expect(formatSessionTime(start, 'Asia/Tokyo')).toContain('13:00')
  })
})
