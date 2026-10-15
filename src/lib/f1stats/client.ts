import type { ZodType, ZodTypeDef } from 'zod'

import { F1ApiError, F1SchemaError } from '@/lib/f1/errors'

/**
 * Client of api-f1 (github.com/AlanMcLure/api-f1): F1DB history (CC BY 4.0) plus detailed session data from
 * OpenF1 (2023 on). It is optional: without `F1_STATS_URL` every analysis page and link is hidden.
 */
export function statsBaseUrl(): string | null {
  const url = process.env.F1_STATS_URL?.trim()
  return url ? url.replace(/\/$/, '') : null
}

export const statsEnabled = () => statsBaseUrl() !== null

const TIMEOUT_MS = 8_000

export interface StatsRequest {
  /** Seconds the Next.js data cache may serve the response. */
  revalidate: number
  query?: Record<string, string | number>
  fetch?: typeof fetch
}

function buildUrl(base: string, path: string, query?: StatsRequest['query']) {
  const url = new URL(`${base}/${path.replace(/^\//, '')}`)
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, String(value))
  return url.toString()
}

async function request(path: string, options: StatsRequest) {
  const base = statsBaseUrl()
  if (!base) throw new F1ApiError('F1_STATS_URL is not set')
  const url = buildUrl(base, path, options.query)
  const fetchImpl = options.fetch ?? fetch
  let response: Response
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: options.revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    } as RequestInit)
  } catch (error) {
    throw new F1ApiError(`api-f1 unreachable: ${error instanceof Error ? error.message : error}`, undefined, url)
  }
  return { url, response }
}

/** GET a JSON resource and validate it. Throws F1ApiError on any non-2xx status. */
export async function statsGet<T>(path: string, schema: ZodType<T, ZodTypeDef, unknown>, options: StatsRequest) {
  const { url, response } = await request(path, options)
  if (!response.ok) throw new F1ApiError(`api-f1 answered ${response.status}`, response.status, url)
  return parse(url, schema, await response.json())
}

/** Like statsGet, but a 404 (no such resource, or no detailed data for that session) returns null. */
export async function statsGetOrNull<T>(
  path: string,
  schema: ZodType<T, ZodTypeDef, unknown>,
  options: StatsRequest
): Promise<T | null> {
  const { url, response } = await request(path, options)
  if (response.status === 404) return null
  if (!response.ok) throw new F1ApiError(`api-f1 answered ${response.status}`, response.status, url)
  return parse(url, schema, await response.json())
}

function parse<T>(url: string, schema: ZodType<T, ZodTypeDef, unknown>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) throw new F1SchemaError(url, result.error.issues)
  return result.data
}
