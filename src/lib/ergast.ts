// ergast.com was shut down at the end of the 2024 season. Jolpica-F1 is its
// drop-in successor (same paths and JSON shape). Override with ERGAST_BASE_URL.
// Jolpica rate limits: 4 requests/second, 500 requests/hour per IP.
export const ERGAST_BASE_URL =
  process.env.ERGAST_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1'

// Revalidate hourly: keeps the current season's standings and calendar fresh
// while staying well under the Jolpica hourly limit.
export const ERGAST_FETCH_OPTIONS = { next: { revalidate: 3600 } } as const

// Jolpica caps `limit` at 100 (Ergast allowed 1000), so large lists are read page by page.
const ERGAST_MAX_LIMIT = 100

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAllDrivers(path: string): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drivers: any[] = []
  let total = Infinity

  while (drivers.length < total) {
    const res = await fetch(
      `${ERGAST_BASE_URL}/${path}?limit=${ERGAST_MAX_LIMIT}&offset=${drivers.length}`,
      ERGAST_FETCH_OPTIONS
    )
    if (!res.ok) throw new Error('Network response was not ok')

    const { MRData } = await res.json()
    const page = MRData.DriverTable.Drivers
    total = parseInt(MRData.total, 10)
    if (!page.length) break
    drivers.push(...page)
  }

  return drivers
}
