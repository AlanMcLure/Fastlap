import 'server-only'

const BASE = (process.env.OPENF1_BASE_URL ?? 'https://api.openf1.org/v1').replace(/\/$/, '')
/** Free tier: 30 requests a minute. One every 2.2 s stays under it. */
const SPACING_MS = 2200
const RETRIES = 3
const TIMEOUT_MS = 60_000

/** OpenF1 closes the free API (past sessions too) while a live session is running. */
export class OpenF1LockedError extends Error {
  constructor() {
    super('OpenF1 no está disponible mientras hay una sesión de F1 en directo')
  }
}

let last = 0
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** GET an OpenF1 endpoint (`/v1/<endpoint>?...`), spaced, with retries on 429/5xx/network errors. */
export async function openF1<T>(endpoint: string, query: Record<string, string | number>): Promise<T[]> {
  const url = `${BASE}/${endpoint}?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`
  for (let attempt = 0; ; attempt++) {
    const wait = last + SPACING_MS - Date.now()
    if (wait > 0) await sleep(wait)
    last = Date.now()

    let response: Response
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
    } catch (error) {
      if (attempt < RETRIES) continue
      throw error
    }
    if (response.ok) return (await response.json()) as T[]
    if (response.status === 401) {
      const body = await response.text()
      if (/live f1 session/i.test(body)) throw new OpenF1LockedError()
      throw new Error(`OpenF1 ${endpoint}: 401`)
    }
    if ((response.status === 429 || response.status >= 500) && attempt < RETRIES) {
      await sleep(Math.min(Number(response.headers.get('retry-after')) || 2 ** attempt * 5, 30) * 1000)
      continue
    }
    throw new Error(`OpenF1 ${endpoint}: ${response.status}`)
  }
}
