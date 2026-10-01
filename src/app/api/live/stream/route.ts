import { getLiveHub, liveEnabled } from '@/lib/live/hub'

export const dynamic = 'force-dynamic'
// Needs a long-lived Node process (Docker/standalone); serverless platforms cut the connection.
export const runtime = 'nodejs'

const MAX_CLIENTS = 500
const HEARTBEAT_MS = 15_000

/** Server-Sent Events stream of the live timing state (prototype, simulated source). */
export async function GET(req: Request) {
  if (!liveEnabled()) return new Response('Not found', { status: 404 })

  const hub = getLiveHub()
  if (hub.listenerCount >= MAX_CLIENTS) return new Response('Too many viewers', { status: 503 })

  const encoder = new TextEncoder()
  let cleanup = () => {}

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          cleanup()
        }
      }
      const unsubscribe = hub.subscribe((state) => send(`id: ${state.seq}\ndata: ${JSON.stringify(state)}\n\n`))
      const heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS)
      cleanup = () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
      req.signal.addEventListener('abort', cleanup)
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
