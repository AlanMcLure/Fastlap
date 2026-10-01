/**
 * Provider-neutral live timing state. A source (today only the simulator) turns
 * whatever it reads into this shape; everything downstream (hub, SSE, UI) depends
 * on nothing else, so replacing the source does not touch the delivery side.
 */
export type SessionStatus = 'green' | 'safety-car' | 'finished'

export interface TowerRow {
  position: number
  driverId: string
  code: string
  /** Seconds behind the leader; 0 for the leader. */
  gap: number
  /** Seconds behind the car in front; 0 for the leader. */
  interval: number
  /** Laps the car is behind the leader. */
  lapsDown: number
}

export interface RaceMessage {
  id: number
  lap: number
  text: string
}

export interface LiveState {
  /** Identifies one run of the source; `seq` starts again at 1 in a new run. */
  run: number
  /** Increases with every published state within a run; clients use it to drop stale or duplicate updates. */
  seq: number
  sessionName: string
  status: SessionStatus
  lap: number
  totalLaps: number
  tower: TowerRow[]
  /** Newest first, capped. */
  messages: RaceMessage[]
}
