export const FIRST_SEASON = 1950

/** The season asked for in the URL, or the current one when it is missing or invalid. */
export function resolveSeason(raw: string | undefined, now = new Date()): number {
  const current = now.getUTCFullYear()
  const requested = Number(raw)
  return raw !== undefined && Number.isInteger(requested) && requested >= FIRST_SEASON && requested <= current + 1
    ? requested
    : current
}

/** Years for a season selector: the current year back to 1950, plus the selected one if it is newer. */
export function seasonOptions(selected: number, now = new Date()): number[] {
  const current = now.getUTCFullYear()
  const years = Array.from({ length: current - FIRST_SEASON + 1 }, (_, i) => current - i)
  return years.includes(selected) ? years : [selected, ...years]
}
