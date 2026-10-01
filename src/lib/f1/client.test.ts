/* eslint-disable @typescript-eslint/no-explicit-any -- the tests mutate raw JSON on purpose */
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { createF1Client } from './client'
import { F1ApiError, F1SchemaError } from './errors'

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })

const pageSchema = z.object({
  MRData: z.object({ total: z.string().transform(Number), items: z.array(z.number()) }),
})

function setup(responses: Array<Response | Error>, options = {}) {
  const queue = [...responses]
  const fetchMock = vi.fn(async () => {
    const next = queue.shift()
    if (!next) throw new Error('no more mocked responses')
    if (next instanceof Error) throw next
    return next
  })
  const sleeps: number[] = []
  const client = createF1Client({
    baseUrl: 'https://f1.test/ergast/f1/',
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async (ms) => void sleeps.push(ms),
    minIntervalMs: 0,
    ...options,
  })
  return { client, fetchMock, sleeps }
}

describe('F1 client', () => {
  it('builds the URL, validates and returns the parsed body', async () => {
    const { client, fetchMock } = setup([json({ MRData: { total: '1', items: [1] } })])
    const data = await client.get('2025.json', pageSchema, { revalidate: 60, query: { limit: 100 } })
    expect(data.MRData.total).toBe(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, any]
    expect(url).toBe('https://f1.test/ergast/f1/2025.json?limit=100')
    expect(init.next).toEqual({ revalidate: 60 })
  })

  it('retries on 503 with backoff, then succeeds', async () => {
    const { client, fetchMock, sleeps } = setup([
      new Response('', { status: 503 }),
      new Response('', { status: 502 }),
      json({ MRData: { total: '0', items: [] } }),
    ])
    await client.get('x.json', pageSchema, { revalidate: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(sleeps).toEqual([500, 1000])
  })

  it('honours Retry-After on 429 (capped at 10 s)', async () => {
    const { client, sleeps } = setup([
      new Response('', { status: 429, headers: { 'retry-after': '3' } }),
      new Response('', { status: 429, headers: { 'retry-after': '999' } }),
      json({ MRData: { total: '0', items: [] } }),
    ])
    await client.get('x.json', pageSchema, { revalidate: 1 })
    expect(sleeps).toEqual([3000, 10_000])
  })

  it('does not retry a 404', async () => {
    const { client, fetchMock } = setup([new Response('', { status: 404 })])
    await expect(client.get('x.json', pageSchema, { revalidate: 1 })).rejects.toMatchObject({ name: 'F1ApiError', status: 404 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('gives up after maxRetries and reports the last status', async () => {
    const { client, fetchMock } = setup(Array.from({ length: 4 }, () => new Response('', { status: 500 })), { maxRetries: 3 })
    await expect(client.get('x.json', pageSchema, { revalidate: 1 })).rejects.toMatchObject({ status: 500 })
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('retries network errors and wraps the final one', async () => {
    const { client } = setup(Array.from({ length: 2 }, () => new Error('ECONNRESET')), { maxRetries: 1 })
    const error = await client.get('x.json', pageSchema, { revalidate: 1 }).catch((e) => e)
    expect(error).toBeInstanceOf(F1ApiError)
    expect(error.message).toContain('ECONNRESET')
  })

  it('throws F1SchemaError when the body does not match', async () => {
    const { client } = setup([json({ MRData: { total: '1' } })])
    const error = await client.get('x.json', pageSchema, { revalidate: 1 }).catch((e) => e)
    expect(error).toBeInstanceOf(F1SchemaError)
    expect(error.message).toContain('MRData.items')
  })

  it('throws F1ApiError for a body that is not JSON', async () => {
    const { client } = setup([new Response('<html>', { status: 200 })])
    await expect(client.get('x.json', pageSchema, { revalidate: 1 })).rejects.toBeInstanceOf(F1ApiError)
  })

  it('spaces requests by minIntervalMs', async () => {
    const { client, sleeps } = setup(
      [json({ MRData: { total: '0', items: [] } }), json({ MRData: { total: '0', items: [] } })],
      { minIntervalMs: 250 }
    )
    await Promise.all([client.get('a.json', pageSchema, { revalidate: 1 }), client.get('b.json', pageSchema, { revalidate: 1 })])
    expect(sleeps.length).toBeGreaterThanOrEqual(1)
    expect(sleeps.every((ms) => ms > 0 && ms <= 250)).toBe(true)
  })

  it('getAll reads every page of 100 and stops at total', async () => {
    const items = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i)
    const { client, fetchMock } = setup([
      json({ MRData: { total: '230', items: items(0, 100) } }),
      json({ MRData: { total: '230', items: items(100, 100) } }),
      json({ MRData: { total: '230', items: items(200, 30) } }),
    ])
    const all = await client.getAll('big.json', pageSchema, (p) => p.MRData.items, { revalidate: 1 })
    expect(all).toHaveLength(230)
    expect(all[229]).toBe(229)
    const urls = fetchMock.mock.calls.map((c) => (c as unknown as [string])[0])
    expect(urls).toEqual([
      'https://f1.test/ergast/f1/big.json?limit=100&offset=0',
      'https://f1.test/ergast/f1/big.json?limit=100&offset=100',
      'https://f1.test/ergast/f1/big.json?limit=100&offset=200',
    ])
  })

  it('getAll does not loop forever if the API returns an empty page', async () => {
    const { client, fetchMock } = setup([json({ MRData: { total: '500', items: [] } })])
    expect(await client.getAll('x.json', pageSchema, (p) => p.MRData.items, { revalidate: 1 })).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
