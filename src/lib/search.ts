export const MIN_QUERY = 2
export const MAX_QUERY = 50

/** The query ready to search for, or null when it is too short. Whitespace is collapsed and long text cut. */
export function normalizeQuery(raw: string | null | undefined): string | null {
  const q = (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY)
  return q.length >= MIN_QUERY ? q : null
}

/** Lower case without accents, so "Pérez" matches "perez". */
export const foldText = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export interface NamedDriver {
  driverId: string
  givenName: string
  familyName: string
  code?: string
}

/**
 * Drivers whose name (or three-letter code) contains the query, accents and case ignored.
 * Those whose family name, given name or code starts with it come first.
 */
export function matchDrivers<T extends NamedDriver>(drivers: T[], query: string, limit = 4): T[] {
  const q = foldText(query)
  const scored: { driver: T; rank: number }[] = []
  for (const driver of drivers) {
    const family = foldText(driver.familyName)
    const given = foldText(driver.givenName)
    const code = foldText(driver.code ?? '')
    const full = `${given} ${family}`
    if (family.startsWith(q) || given.startsWith(q) || code === q) scored.push({ driver, rank: 0 })
    else if (full.includes(q)) scored.push({ driver, rank: 1 })
  }
  return scored
    .sort((a, b) => a.rank - b.rank || a.driver.familyName.localeCompare(b.driver.familyName, 'es'))
    .slice(0, limit)
    .map((s) => s.driver)
}

export interface SearchResults {
  communities: { name: string; members: number }[]
  users: { username: string }[]
  posts: { id: string; title: string; community: string }[]
  drivers: { id: string; name: string }[]
}

export const emptyResults = (): SearchResults => ({ communities: [], users: [], posts: [], drivers: [] })
export const totalResults = (r: SearchResults) => r.communities.length + r.users.length + r.posts.length + r.drivers.length

/** Escapes `%`, `_` and `\` so that a typed query is matched literally by LIKE (Prisma does not escape them). */
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&')
