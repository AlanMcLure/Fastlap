/**
 * In-memory sliding-window rate limits. The app runs as one long-lived instance (see
 * docs/DESPLIEGUE.md), so a per-process counter is enough; with several instances each one would
 * count on its own and the limits would multiply — move them to Postgres or Redis then
 * (docs/IDEAS.md, "Redis"). Counters are lost on restart, which is fine for anti-abuse windows.
 */

const UNITS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const
type Window = `${number} ${keyof typeof UNITS}`

const parseWindow = (window: Window) => {
  const [amount, unit] = window.split(' ') as [string, keyof typeof UNITS]
  return Number(amount) * UNITS[unit]
}

/** Entries are swept at most this often, so idle identifiers do not pile up in memory. */
const SWEEP_EVERY_MS = 60_000

export class RateLimit {
  private readonly windowMs: number
  private readonly hits = new Map<string, number[]>()
  private lastSweep = 0

  constructor(
    private readonly max: number,
    window: Window,
    private readonly now: () => number = Date.now
  ) {
    this.windowMs = parseWindow(window)
  }

  /** Counts one request for `id`; `success` is false once `max` requests fall inside the window. Async to keep the old API. */
  async limit(id: string): Promise<{ success: boolean }> {
    const now = this.now()
    this.sweep(now)
    const recent = (this.hits.get(id) ?? []).filter((t) => now - t < this.windowMs)
    if (recent.length >= this.max) {
      this.hits.set(id, recent)
      return { success: false }
    }
    recent.push(now)
    this.hits.set(id, recent)
    return { success: true }
  }

  private sweep(now: number) {
    if (now - this.lastSweep < SWEEP_EVERY_MS) return
    this.lastSweep = now
    for (const [id, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(id)
    }
  }
}

export const voteRatelimit = new RateLimit(10, '10 s')

export const postRatelimit = new RateLimit(5, '1 m')

export const commentRatelimit = new RateLimit(10, '1 m')

/** Reports: a few per minute and a daily cap, so the queue cannot be flooded. */
export const reportRatelimit = new RateLimit(5, '1 m')

export const reportDailyRatelimit = new RateLimit(30, '1 d')

/** Account deletion is irreversible: a few attempts per hour is plenty. */
export const accountDeleteRatelimit = new RateLimit(3, '1 h')

/** Data export reads many tables: a few downloads per hour is plenty. */
export const accountExportRatelimit = new RateLimit(3, '1 h')

/** Daily mini-games are public (no account): limit per IP so the guess endpoint cannot be hammered. */
export const gameRatelimit = new RateLimit(60, '1 m')
