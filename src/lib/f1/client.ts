import type { ZodType, ZodTypeDef } from 'zod'

import { ERGAST_BASE_URL } from '@/lib/ergast'

import { F1ApiError, F1SchemaError } from './errors'

// Jolpica allows 4 requests/second and 500/hour per IP and caps `limit` at 100.
export const MAX_PAGE_SIZE = 100

export interface F1ClientOptions {
  baseUrl?: string
  fetch?: typeof fetch
  /** Minimum gap between two requests from this process. */
  minIntervalMs?: number
  maxRetries?: number
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
}

export interface RequestOptions {
  /** Seconds the Next.js data cache may serve the response. */
  revalidate: number
  query?: Record<string, string | number>
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const isRetryable = (status: number) => status === 429 || status >= 500

export function createF1Client(options: F1ClientOptions = {}) {
  const {
    baseUrl = ERGAST_BASE_URL,
    fetch: fetchImpl = (...args: Parameters<typeof fetch>) => fetch(...args),
    minIntervalMs = 260,
    maxRetries = 3,
    timeoutMs = 10_000,
    sleep = defaultSleep,
  } = options

  // Serialises request starts so bursts stay under the API's per-second limit.
  let queue: Promise<void> = Promise.resolve()
  let lastStart = 0
  const waitForSlot = () => {
    const slot = queue.then(async () => {
      const wait = lastStart + minIntervalMs - Date.now()
      if (wait > 0) await sleep(wait)
      lastStart = Date.now()
    })
    queue = slot.catch(() => undefined)
    return slot
  }

  const buildUrl = (path: string, query?: RequestOptions['query']) => {
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`)
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, String(value))
    }
    return url.toString()
  }

  async function getJson(url: string, revalidate: number): Promise<unknown> {
    let lastError: F1ApiError | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await waitForSlot()

      let response: Response
      try {
        response = await fetchImpl(url, {
          next: { revalidate },
          signal: AbortSignal.timeout(timeoutMs),
        } as RequestInit)
      } catch (error) {
        lastError = new F1ApiError(
          `Could not reach the F1 API: ${error instanceof Error ? error.message : 'unknown error'}`,
          undefined,
          url
        )
        if (attempt < maxRetries) await sleep(500 * 2 ** attempt)
        continue
      }

      if (response.ok) {
        try {
          return await response.json()
        } catch {
          throw new F1ApiError('The F1 API returned a body that is not valid JSON', response.status, url)
        }
      }

      lastError = new F1ApiError(`The F1 API answered ${response.status}`, response.status, url)
      if (!isRetryable(response.status)) throw lastError

      if (attempt < maxRetries) {
        const retryAfter = Number(response.headers.get('retry-after'))
        const delay = retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 500 * 2 ** attempt
        await sleep(delay)
      }
    }

    throw lastError ?? new F1ApiError('The F1 API request failed', undefined, url)
  }

  /** GET one resource and validate it against `schema`. */
  async function get<Out, In = unknown>(
    path: string,
    schema: ZodType<Out, ZodTypeDef, In>,
    { revalidate, query }: RequestOptions
  ): Promise<Out> {
    const url = buildUrl(path, query)
    const parsed = schema.safeParse(await getJson(url, revalidate))
    if (!parsed.success) throw new F1SchemaError(url, parsed.error.issues)
    return parsed.data
  }

  /**
   * Read every page of a list endpoint (100 items per request) and concatenate
   * the items extracted by `pick`. Stops when `total` items have been read.
   */
  async function getAll<Out extends { MRData: { total: number } }, Item, In = unknown>(
    path: string,
    schema: ZodType<Out, ZodTypeDef, In>,
    pick: (page: Out) => Item[],
    { revalidate, query }: RequestOptions
  ): Promise<Item[]> {
    const items: Item[] = []
    let offset = 0
    let total = Infinity

    while (offset < total) {
      const page = await get(path, schema, {
        revalidate,
        query: { ...query, limit: MAX_PAGE_SIZE, offset },
      })
      total = page.MRData.total
      const pageItems = pick(page)
      if (pageItems.length === 0) break
      items.push(...pageItems)
      offset += MAX_PAGE_SIZE
    }

    return items
  }

  return { get, getAll }
}

export const f1Client = createF1Client()
