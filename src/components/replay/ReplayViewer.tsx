'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  clock, compoundOn, decodeDeltas, fastestUntil, formatGap, indexAt, lapOf, lapTime, lastLap, positionsAt, trackStatusAt,
  valueAt, type Gap, type Replay, type TrackStatus,
} from '@/lib/replay/format'
import { cn } from '@/lib/utils'
import { drawReplay, type DrawCar, type ReplayStyle } from './draw'

interface Car {
  number: number
  code: string
  name: string
  team: string
  color: string
  x: (number | null)[]
  y: (number | null)[]
  laps: number[]
  lapTimes: (number | null)[]
  gaps: [number, Gap, Gap][]
}

const SPEEDS = [1, 4, 16, 32]
/** How often the tower, clock and messages re-render while playing (the canvas runs every frame). */
const UI_EVERY_MS = 200
const STYLE_KEY = 'fastlap-replay-style'
const STYLES: { value: ReplayStyle; label: string }[] = [
  { value: 'pista', label: 'Pista' },
  { value: 'matriz', label: 'Matriz' },
  { value: 'estelas', label: 'Estelas' },
]

const STATUS_LABEL: Record<TrackStatus, string | null> = {
  green: null,
  sc: 'COCHE DE SEGURIDAD',
  vsc: 'COCHE DE SEGURIDAD VIRTUAL',
  red: 'BANDERA ROJA',
}

const TYRE: Record<string, string> = { SOFT: 'B', MEDIUM: 'M', HARD: 'D', INTERMEDIATE: 'I', WET: 'LL' }
const TYRE_NAME: Record<string, string> = { SOFT: 'blando', MEDIUM: 'medio', HARD: 'duro', INTERMEDIATE: 'intermedio', WET: 'lluvia' }

/** Position of a car at a fractional frame: interpolated between the two stored frames around it. */
function carAt(car: Car, frame: number): [number, number] | null {
  if (frame < 0) return null
  const i = Math.floor(frame)
  const k = frame - i
  const ax = car.x[i]
  const ay = car.y[i]
  const bx = car.x[i + 1]
  const by = car.y[i + 1]
  if (ax != null && ay != null && bx != null && by != null) return [ax + (bx - ax) * k, ay + (by - ay) * k]
  if (ax != null && ay != null) return [ax, ay]
  if (bx != null && by != null) return [bx, by]
  return null
}

const cssColor = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value ? `rgb(${value.split(/\s+/).join(',')})` : fallback
}

const savedStyle = (): ReplayStyle => {
  try {
    const v = localStorage.getItem(STYLE_KEY)
    return v === 'matriz' || v === 'estelas' ? v : 'pista'
  } catch {
    return 'pista'
  }
}

/** Race replay: the cars on the circuit, the timing tower and race control, with playback controls. */
const ReplayViewer = ({ season, round }: { season: number; round: number }) => {
  const [replay, setReplay] = useState<Replay | null>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(4)
  const [uiTime, setUiTime] = useState(0)
  // the style buttons only render once the replay has loaded in the browser, so reading the saved
  // choice here cannot make the server and client markup differ
  const [style, setStyle] = useState<ReplayStyle>(() => (typeof window === 'undefined' ? 'pista' : savedStyle()))
  const [labels, setLabels] = useState(true)
  const [focus, setFocus] = useState<number | null>(null)
  const [gapMode, setGapMode] = useState<'leader' | 'interval'>('leader')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const time = useRef(0)
  const live = useRef({ playing: false, speed: 4, style: 'pista' as ReplayStyle, labels: true, focus: null as number | null })

  useEffect(() => {
    live.current = { playing, speed, style, labels, focus }
  }, [playing, speed, style, labels, focus])

  const chooseStyle = (value: ReplayStyle) => {
    setStyle(value)
    try {
      localStorage.setItem(STYLE_KEY, value)
    } catch {
      // private mode or storage blocked: the choice just is not remembered
    }
  }

  useEffect(() => {
    let cancelled = false
    fetch(`/api/f1/replay/${season}/${round}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Replay) => {
        if (cancelled) return
        // start just before the first lap, not at the session start
        const start = Math.max(0, (data.leaderLaps[0]?.[0] ?? 0) - 15)
        time.current = start
        setUiTime(start)
        setReplay(data)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [season, round])

  const cars: Car[] = useMemo(
    () => (replay ? replay.drivers.map((d) => ({ ...d, x: decodeDeltas(d.x), y: decodeDeltas(d.y) })) : []),
    [replay]
  )
  const duration = replay ? replay.frames / replay.hz : 0
  const totalLaps = replay ? replay.leaderLaps.at(-1)?.[1] ?? 0 : 0

  // the drawing loop: advances the clock while playing and paints every animation frame
  useEffect(() => {
    if (!replay) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const drawCars: (DrawCar & { number: number })[] = cars.map((car) => ({
      number: car.number,
      code: car.code,
      color: car.color,
      at: (frame: number) => carAt(car, frame),
    }))

    let raf = 0
    let previous = performance.now()
    let lastUi = 0
    const tick = (now: number) => {
      const o = live.current
      const dt = (now - previous) / 1000
      previous = now
      if (o.playing) {
        time.current = Math.min(duration, time.current + dt * o.speed)
        if (time.current >= duration) setPlaying(false)
      }
      if (now - lastUi > UI_EVERY_MS) {
        lastUi = now
        setUiTime(time.current)
      }

      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const order = positionsAt(replay.positions, time.current)
      drawReplay(ctx, width, height, replay.track, {
        style: o.style,
        frame: time.current * replay.hz,
        hz: replay.hz,
        cars: [...drawCars].sort((a, b) => (order.get(b.number) ?? 99) - (order.get(a.number) ?? 99)),
        focus: o.focus,
        labels: o.labels,
        colors: {
          track: cssColor('--input', '#333'),
          faint: cssColor('--faint', '#666'),
          label: cssColor('--foreground', '#e8e8e8'),
          background: cssColor('--background', '#000'),
          display: cssColor('--display', '#fff'),
        },
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [replay, cars, duration])

  const seek = useCallback(
    (t: number) => {
      time.current = Math.max(0, Math.min(duration, t))
      setUiTime(time.current)
    },
    [duration]
  )

  if (failed) {
    return <p className='py-10 text-muted-foreground'>No se ha podido cargar la repetición. Prueba a recargar la página.</p>
  }
  if (!replay) {
    return (
      <div className='flex h-[min(60vh,560px)] min-h-[280px] items-center justify-center rounded-xl border border-border' aria-busy='true'>
        <p className='label'>CARGANDO LA CARRERA…</p>
      </div>
    )
  }

  const t = uiTime
  const order = positionsAt(replay.positions, t)
  const tower = cars.filter((c) => order.has(c.number)).sort((a, b) => order.get(a.number)! - order.get(b.number)!)
  const lap = valueAt(replay.leaderLaps, t, 0)
  const status = trackStatusAt(replay.control, t)
  const messages = replay.control.filter(([time]) => time <= t).slice(-3).reverse()
  const fastest = fastestUntil(cars, t)
  const focused = cars.find((c) => c.number === focus) ?? null

  const gapOf = (car: Car) => {
    const i = indexAt(car.gaps, t)
    if (i < 0) return ''
    const [, toLeader, interval] = car.gaps[i]
    return formatGap(gapMode === 'leader' ? toLeader : interval)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return
    if (e.key === ' ') {
      e.preventDefault()
      setPlaying((p) => !p)
    } else if (e.key === 'ArrowRight') seek(time.current + 10)
    else if (e.key === 'ArrowLeft') seek(time.current - 10)
    else if (e.key === 'Escape') setFocus(null)
  }

  const pill = (active: boolean) =>
    cn(
      'h-9 rounded-full border px-3 font-mono text-xs transition-colors',
      active ? 'border-display text-display' : 'border-input text-muted-foreground hover:text-display'
    )

  return (
    <div className='space-y-4' onKeyDown={onKey}>
      <div className='flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-3'>
        <p className='font-mono text-sm text-display'>
          <span className='label mr-2'>VUELTA</span>
          {lap}/{totalLaps}
        </p>
        <p className='font-mono text-sm text-display'>
          <span className='label mr-2'>TIEMPO</span>
          {clock(t)}
        </p>
        {fastest && (
          <p className='font-mono text-sm text-display'>
            <span className='label mr-2'>VUELTA RÁPIDA</span>
            {cars.find((c) => c.number === fastest.number)?.code} {lapTime(fastest.time)}
          </p>
        )}
        {STATUS_LABEL[status] && (
          <p role='status' className='label rounded-full border border-signal px-3 py-1 text-signal'>
            ● {STATUS_LABEL[status]}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='min-w-0 flex-1'>
          <canvas
            ref={canvasRef}
            className='h-[min(60vh,560px)] min-h-[280px] w-full rounded-xl border border-border bg-card'
            role='img'
            aria-label={`Posición de los coches en la vuelta ${lap} de ${totalLaps}`}
          />

          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <button
              type='button'
              onClick={() => (t >= duration ? (seek(0), setPlaying(true)) : setPlaying((p) => !p))}
              aria-label={playing ? 'Pausar' : 'Reproducir'}
              className='flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              {t >= duration ? <RotateCcw className='h-5 w-5' /> : playing ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
            </button>
            <div role='group' aria-label='Velocidad' className='flex gap-1'>
              {SPEEDS.map((s) => (
                <button key={s} type='button' aria-pressed={speed === s} onClick={() => setSpeed(s)} className={pill(speed === s)}>
                  ×{s}
                </button>
              ))}
            </div>
            <label className='flex min-w-[12rem] flex-1 items-center gap-3'>
              <span className='sr-only'>Momento de la carrera</span>
              <input
                type='range'
                min={0}
                max={Math.floor(duration)}
                step={1}
                value={Math.floor(t)}
                onChange={(e) => seek(Number(e.target.value))}
                className='w-full accent-[rgb(var(--display))]'
              />
            </label>
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2'>
            <div role='group' aria-label='Estilo' className='flex items-center gap-1'>
              <span className='label mr-1'>ESTILO</span>
              {STYLES.map((s) => (
                <button key={s.value} type='button' aria-pressed={style === s.value} onClick={() => chooseStyle(s.value)} className={pill(style === s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
            <button type='button' aria-pressed={labels} onClick={() => setLabels((v) => !v)} className={pill(labels)}>
              Siglas
            </button>
            <p className='label'>ESPACIO: PAUSA · ← → : 10 S · PULSA UN PILOTO PARA SEGUIRLO</p>
          </div>
        </div>

        <div className='w-full shrink-0 lg:w-80'>
          <div className='flex items-center justify-between pb-2'>
            <p className='label'>CLASIFICACIÓN</p>
            <div role='group' aria-label='Diferencias' className='flex gap-1'>
              <button type='button' aria-pressed={gapMode === 'leader'} onClick={() => setGapMode('leader')} className={pill(gapMode === 'leader')}>
                Líder
              </button>
              <button type='button' aria-pressed={gapMode === 'interval'} onClick={() => setGapMode('interval')} className={pill(gapMode === 'interval')}>
                Intervalo
              </button>
            </div>
          </div>
          <ol aria-label='Clasificación en este momento' className='divide-y divide-border border-y border-border'>
            {tower.map((car) => {
              const pos = order.get(car.number)
              const compound = compoundOn(replay.stints, car.number, Math.max(1, lapOf(car, t)))
              const last = lastLap(car, t)
              const isFocus = focus === car.number
              return (
                <li key={car.number}>
                  <button
                    type='button'
                    aria-pressed={isFocus}
                    onClick={() => setFocus(isFocus ? null : car.number)}
                    className={cn(
                      'flex w-full items-center gap-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                      isFocus && 'bg-accent',
                      focus !== null && !isFocus && 'opacity-50'
                    )}>
                    <span className='w-6 text-right font-mono text-display'>{pos}</span>
                    <span className='h-4 w-1 rounded-full' style={{ backgroundColor: car.color }} aria-hidden='true' />
                    <span className='w-11 font-mono font-bold text-display' title={car.name}>
                      {car.code}
                      {fastest?.number === car.number && (
                        <span className='ml-0.5 text-[10px]' title='Vuelta rápida'>
                          ◆
                        </span>
                      )}
                    </span>
                    <span className='flex-1 text-right font-mono text-xs tabular-nums text-foreground'>{pos === 1 ? 'LÍDER' : gapOf(car)}</span>
                    <span className='w-16 text-right font-mono text-xs tabular-nums text-muted-foreground'>{last ? lapTime(last.time) : ''}</span>
                    <span className='label w-5 text-center' title={compound ? `Neumático ${TYRE_NAME[compound] ?? compound.toLowerCase()}` : undefined}>
                      {compound ? TYRE[compound] ?? compound[0] : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className='label mt-2'>DIFERENCIA · ÚLTIMA VUELTA · NEUMÁTICO · ◆ VUELTA RÁPIDA</p>

          {focused && (
            <section aria-label={`Siguiendo a ${focused.name}`} className='mt-4 border-b border-border pb-4'>
              <p className='label'>SIGUIENDO</p>
              <p className='mt-1 text-display'>
                {focused.name} <span className='text-muted-foreground'>· {focused.team}</span>
              </p>
              <p className='mt-1 font-mono text-xs text-muted-foreground'>
                VUELTA {lapOf(focused, t)} · MEJOR{' '}
                {lapTime(
                  focused.lapTimes
                    .slice(0, Math.max(0, lapOf(focused, t) - 1))
                    .reduce<number | null>((best, v) => (v !== null && (best === null || v < best) ? v : best), null)
                )}
              </p>
            </section>
          )}

          {messages.length > 0 && (
            <section aria-label='Dirección de carrera' className='mt-4'>
              <p className='label'>DIRECCIÓN DE CARRERA</p>
              <ul className='mt-2 space-y-1.5 text-sm'>
                {messages.map(([time, kind, message]) => (
                  <li key={`${time}-${message}`} className={cn(kind === 'sc' || kind === 'vsc' || kind === 'red' ? 'text-signal' : 'text-muted-foreground')}>
                    <span className='font-mono text-xs'>{clock(time)}</span> {message}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <p className='text-xs text-muted-foreground'>{replay.source}</p>
    </div>
  )
}

export default ReplayViewer
