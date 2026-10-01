// Measures the delivery side of the live prototype: opens N SSE clients against /api/live/stream
// and reports payload size, update rate and how far apart in time the clients receive the same update.
// Usage: node scripts/measure-live.mjs [clients=200] [seconds=20] [baseUrl=http://localhost:3100] [pid]
// With a server pid it also samples that process's resident memory and CPU time (Linux).
import http from 'node:http'
import { readFileSync } from 'node:fs'

const clients = Number(process.argv[2] ?? 200)
const seconds = Number(process.argv[3] ?? 20)
const base = new URL(process.argv[4] ?? 'http://localhost:3100')
const pid = process.argv[5]

const agent = new http.Agent({ keepAlive: true, maxSockets: clients + 10 })
const arrivals = new Map() // "run:seq" -> arrival timestamps (ms) across clients
let bytes = 0
let updates = 0
let failed = 0
let firstPayload = 0

function procStats() {
  if (!pid) return null
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8').split(' ')
  const status = readFileSync(`/proc/${pid}/status`, 'utf8')
  const rssKb = Number(/VmRSS:\s+(\d+)/.exec(status)?.[1] ?? 0)
  const cpuSeconds = (Number(stat[13]) + Number(stat[14])) / 100
  return { rssMb: rssKb / 1024, cpuSeconds }
}

function connect() {
  const req = http.get({ hostname: base.hostname, port: base.port, path: '/api/live/stream', agent }, (res) => {
    if (res.statusCode !== 200) { failed++; res.resume(); return }
    let buffer = ''
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      const at = performance.now()
      buffer += chunk
      let end
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        if (!frame.startsWith('id:')) continue // heartbeat
        const json = frame.slice(frame.indexOf('data: ') + 6)
        const state = JSON.parse(json)
        bytes += Buffer.byteLength(frame) + 2
        updates++
        if (!firstPayload) firstPayload = Buffer.byteLength(json)
        const key = `${state.run}:${state.seq}`
        const list = arrivals.get(key) ?? []
        list.push(at)
        arrivals.set(key, list)
      }
    })
  })
  req.on('error', () => failed++)
}

const before = procStats()
for (let i = 0; i < clients; i++) connect()
await new Promise((r) => setTimeout(r, seconds * 1000))
const after = procStats()

// Only updates every client saw count for the spread; the first (sent on connect) is excluded.
// The first updates also cover the ramp-up (clients connect over a few hundred ms), so they are skipped.
const spreads = [...arrivals.values()]
  .slice(3)
  .filter((l) => l.length >= clients * 0.95)
  .map((l) => Math.max(...l) - Math.min(...l))
spreads.sort((a, b) => a - b)
const pct = (p) => (spreads.length ? spreads[Math.min(spreads.length - 1, Math.floor(spreads.length * p))].toFixed(1) : 'n/a')

console.log(JSON.stringify({
  clients, seconds, failedConnections: failed,
  updatesPerClientPerSecond: +(updates / clients / seconds).toFixed(2),
  payloadBytesPerUpdate: firstPayload,
  kbPerClientPerSecond: +(bytes / clients / seconds / 1024).toFixed(2),
  totalMbPerSecondOut: +(bytes / seconds / 1024 / 1024).toFixed(2),
  fanoutSpreadMs: { samples: spreads.length, p50: pct(0.5), p95: pct(0.95), max: pct(0.999) },
  server: before && after ? { rssMbBefore: +before.rssMb.toFixed(0), rssMbAfter: +after.rssMb.toFixed(0), cpuSecondsUsed: +(after.cpuSeconds - before.cpuSeconds).toFixed(2) } : 'pass the server pid to measure',
}, null, 2))
process.exit(0)
