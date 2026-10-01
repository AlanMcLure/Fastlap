const dateFormat = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })
const shortDateFormat = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'short' })

const parse = (date: string) => new Date(`${date}T00:00:00Z`)

/** "16 mar 2025" — a race date as published (a calendar day, shown the same everywhere). */
export const formatRaceDate = (date: string) => dateFormat.format(parse(date)).replace(/\./g, '')

/** "16 mar" */
export const formatRaceDay = (date: string) => shortDateFormat.format(parse(date)).replace(/\./g, '')

/** "05:00" in the viewer's time zone, or in `timeZone` when given (used by tests and the server fallback). */
export function formatSessionTime(start: Date, timeZone?: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
    .format(start)
    .replace(/\./g, '')
}
