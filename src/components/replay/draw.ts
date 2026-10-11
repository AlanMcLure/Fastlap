/**
 * Canvas drawing of the replay: the circuit and the cars in one of three looks.
 *  - pista:   solid track, round car markers (the classic view)
 *  - matriz:  the circuit and the cars as LED dots, in FastLap's dot-matrix language
 *  - estelas: thin track, each car leaving a fading trail (who is faster, who is closing in)
 */

export type ReplayStyle = 'pista' | 'matriz' | 'estelas'

export interface DrawCar {
  number: number
  code: string
  color: string
  /** Position at a fractional frame, or null when the car is not on track. */
  at: (frame: number) => [number, number] | null
}

export interface DrawOptions {
  style: ReplayStyle
  frame: number
  hz: number
  /** Cars back to front (the leader last, so it is drawn on top). */
  cars: DrawCar[]
  focus: number | null
  labels: boolean
  colors: { track: string; faint: string; label: string; background: string; display: string }
}

interface View {
  px: (x: number) => number
  py: (y: number) => number
}

/** Fits the circuit into the canvas, keeping its proportions (OpenF1's y grows upwards). */
export function fitView(track: [number, number][], width: number, height: number, pad = 28): View {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of track) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  const scale = Math.min((width - pad * 2) / (maxX - minX || 1), (height - pad * 2) / (maxY - minY || 1))
  const offX = (width - (maxX - minX) * scale) / 2
  const offY = (height - (maxY - minY) * scale) / 2
  return { px: (x) => offX + (x - minX) * scale, py: (y) => offY + (maxY - y) * scale }
}

/** Points every `step` px along the (screen-space) circuit, for the dotted look. */
function dotsAlong(points: [number, number][], step: number): [number, number][] {
  const out: [number, number][] = []
  let carry = 0
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[(i + 1) % points.length]
    const length = Math.hypot(bx - ax, by - ay)
    let d = carry
    while (d < length) {
      const k = d / length
      out.push([ax + (bx - ax) * k, ay + (by - ay) * k])
      d += step
    }
    carry = d - length
  }
  return out
}

function drawTrack(ctx: CanvasRenderingContext2D, screen: [number, number][], o: DrawOptions) {
  if (o.style === 'matriz') {
    ctx.fillStyle = o.colors.track
    for (const [x, y] of dotsAlong(screen, 7)) {
      ctx.beginPath()
      ctx.arc(x, y, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    ctx.lineWidth = o.style === 'estelas' ? 3 : 10
    ctx.lineJoin = 'round'
    ctx.strokeStyle = o.colors.track
    ctx.beginPath()
    screen.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
    ctx.closePath()
    ctx.stroke()
  }

  // start/finish line across the track and the direction of travel just after it
  const [sx, sy] = screen[0]
  const [nx, ny] = screen[Math.min(4, screen.length - 1)]
  const len = Math.hypot(nx - sx, ny - sy) || 1
  const ux = (nx - sx) / len
  const uy = (ny - sy) / len
  ctx.strokeStyle = o.colors.display
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(sx - uy * 10, sy + ux * 10)
  ctx.lineTo(sx + uy * 10, sy - ux * 10)
  ctx.stroke()
  const ax = sx + ux * 22
  const ay = sy + uy * 22
  ctx.fillStyle = o.colors.faint
  ctx.beginPath()
  ctx.moveTo(ax + ux * 7, ay + uy * 7)
  ctx.lineTo(ax - uy * 5, ay + ux * 5)
  ctx.lineTo(ax + uy * 5, ay - ux * 5)
  ctx.closePath()
  ctx.fill()
}

function drawCar(ctx: CanvasRenderingContext2D, view: View, car: DrawCar, o: DrawOptions) {
  const at = car.at(o.frame)
  if (!at) return
  const x = view.px(at[0])
  const y = view.py(at[1])
  const focused = o.focus === car.number
  ctx.globalAlpha = o.focus === null || focused ? 1 : 0.22

  if (o.style === 'estelas') {
    // the last 6 seconds, sampled every quarter of a second, fading out
    const steps = 24
    let previous: [number, number] | null = [x, y]
    ctx.lineCap = 'round'
    for (let i = 1; i <= steps; i++) {
      const p = car.at(o.frame - (i * o.hz) / 4)
      if (!p || !previous) break
      const point: [number, number] = [view.px(p[0]), view.py(p[1])]
      ctx.strokeStyle = car.color
      ctx.globalAlpha = (o.focus === null || focused ? 1 : 0.22) * (1 - i / steps) * 0.9
      ctx.lineWidth = focused ? 5 : 4
      ctx.beginPath()
      ctx.moveTo(previous[0], previous[1])
      ctx.lineTo(point[0], point[1])
      ctx.stroke()
      previous = point
    }
    ctx.globalAlpha = o.focus === null || focused ? 1 : 0.22
  }

  if (o.style === 'matriz') {
    // a 3×3 block of LEDs
    const cell = focused ? 3.4 : 2.8
    ctx.fillStyle = car.color
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (Math.abs(i) + Math.abs(j) === 2 && !focused) continue // rounded corners
        ctx.beginPath()
        ctx.arc(x + i * cell * 1.3, y + j * cell * 1.3, cell / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else {
    ctx.beginPath()
    ctx.arc(x, y, focused ? 8 : o.style === 'estelas' ? 4.5 : 6, 0, Math.PI * 2)
    ctx.fillStyle = car.color
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = o.colors.background
    ctx.stroke()
  }

  if (o.labels || focused) {
    ctx.fillStyle = focused ? o.colors.display : o.colors.label
    ctx.font = `700 ${focused ? 12 : 10}px var(--font-mono), monospace`
    ctx.fillText(car.code, x + 9, y + 3.5)
  }
  ctx.globalAlpha = 1
}

/** Paints one frame of the replay. */
export function drawReplay(ctx: CanvasRenderingContext2D, width: number, height: number, track: [number, number][], o: DrawOptions) {
  ctx.clearRect(0, 0, width, height)
  const view = fitView(track, width, height)
  const screen = track.map(([x, y]): [number, number] => [view.px(x), view.py(y)])
  drawTrack(ctx, screen, o)
  for (const car of o.cars) if (car.number !== o.focus) drawCar(ctx, view, car, o)
  const focused = o.cars.find((c) => c.number === o.focus)
  if (focused) drawCar(ctx, view, focused, o)
}
