import { createSimulation } from './simulator'
import type { LiveState } from './types'

/** Prototype switch: the simulated live feed is off unless `LIVE_SIMULATION=true`. */
export const liveEnabled = () => process.env.LIVE_SIMULATION === 'true'

export interface LiveSource {
  step(): LiveState
}

/**
 * In-process fan-out of live states. It ticks only while somebody is listening, so an idle
 * deployment costs nothing, and restarts the source a while after it finishes.
 * One instance per Node process: with several instances every one runs its own source
 * (fine for a simulation; a real feed would need one reader and Redis pub/sub in between).
 */
export class LiveHub {
  private listeners = new Set<(state: LiveState) => void>()
  private timer: ReturnType<typeof setInterval> | null = null
  private source: LiveSource
  private latestState: LiveState | null = null
  private finishedAt: number | null = null

  constructor(
    private readonly createSource: () => LiveSource,
    private readonly tickMs = 1000,
    private readonly restartAfterMs = 30_000,
    private readonly now: () => number = Date.now
  ) {
    this.source = createSource()
  }

  get listenerCount() {
    return this.listeners.size
  }

  get latest() {
    return this.latestState
  }

  /** Registers a listener, sends it the current state at once and returns the unsubscribe function. */
  subscribe(listener: (state: LiveState) => void): () => void {
    this.listeners.add(listener)
    if (!this.latestState) this.tick()
    else listener(this.latestState)
    if (!this.timer) this.timer = setInterval(() => this.tick(), this.tickMs)
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  }

  private tick() {
    if (this.finishedAt !== null && this.now() - this.finishedAt >= this.restartAfterMs) {
      this.source = this.createSource()
      this.finishedAt = null
    }
    if (this.finishedAt !== null) return // keep showing the final state
    const state = this.source.step()
    if (state.status === 'finished') this.finishedAt = this.now()
    this.latestState = state
    for (const listener of this.listeners) listener(state)
  }
}

const globalForHub = globalThis as unknown as { liveHub?: LiveHub }

/** Shared hub of the process (kept on `globalThis` so hot reloads do not duplicate it). */
export function getLiveHub(): LiveHub {
  let run = 0
  globalForHub.liveHub ??= new LiveHub(() =>
    createSimulation({ secondsPerStep: Number(process.env.LIVE_SIM_SECONDS_PER_STEP) || 5, run: ++run, seed: run })
  )
  return globalForHub.liveHub
}
