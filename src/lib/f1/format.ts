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

interface NamedDriver {
  code?: string
  familyName: string
}

/** Three-letter code (VER); drivers from before codes existed get the first letters of their surname. */
export const driverCode = (driver: NamedDriver) => driver.code ?? driver.familyName.slice(0, 3).toUpperCase()

/** "22.4" -> 22.4, "1:02.345" -> 62.345 (a stop under a red flag can last minutes). */
export function parseStopSeconds(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.some(Number.isNaN)) return NaN
  return parts.reduce((total, part) => total * 60 + part, 0)
}
