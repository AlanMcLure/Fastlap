'use client'

import { useSyncExternalStore } from 'react'

// One shared one-second clock for every countdown on the page.
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined
let snapshot = 0

const nowSeconds = () => Math.floor(Date.now() / 1000)

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    snapshot = nowSeconds()
    timer = setInterval(() => {
      snapshot = nowSeconds()
      listeners.forEach((notify) => notify())
    }, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const getSnapshot = () => snapshot || nowSeconds()
const getServerSnapshot = () => null

interface CountdownProps {
  /** ISO timestamp of the start of the race. */
  startIso: string
  /** ISO timestamp after which the race counts as finished. */
  endIso: string
}

const pad = (n: number) => String(n).padStart(2, '0')

const Unit = ({ value, label }: { value: string; label: string }) => (
  <div className='text-center'>
    <span className='display block text-3xl sm:text-6xl'>{value}</span>
    <span className='label'>{label}</span>
  </div>
)

/** Countdown to the race start, in dot-matrix digits (the one Doto use on the screen). */
const Countdown = ({ startIso, endIso }: CountdownProps) => {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (now === null) {
    // server render and first client render: no clock yet
    return (
      <div className='flex gap-3 sm:gap-6' aria-hidden='true'>
        <Unit value='--' label='DÍAS' />
        <Unit value='--' label='HORAS' />
        <Unit value='--' label='MIN' />
        <Unit value='--' label='SEG' />
      </div>
    )
  }

  const start = Date.parse(startIso) / 1000
  const end = Date.parse(endIso) / 1000

  if (now >= end) return <p className='label'>CARRERA FINALIZADA</p>
  if (now >= start) {
    return (
      <p className='label flex items-center gap-2 text-signal'>
        <span aria-hidden='true'>●</span> CARRERA EN CURSO
      </p>
    )
  }

  const left = start - now
  const days = Math.floor(left / 86400)
  const hours = Math.floor((left % 86400) / 3600)
  const minutes = Math.floor((left % 3600) / 60)
  const seconds = left % 60

  return (
    <div
      className='flex gap-3 sm:gap-6'
      role='timer'
      aria-label={`Faltan ${days} días, ${hours} horas y ${minutes} minutos`}>
      <Unit value={pad(days)} label='DÍAS' />
      <Unit value={pad(hours)} label='HORAS' />
      <Unit value={pad(minutes)} label='MIN' />
      <Unit value={pad(seconds)} label='SEG' />
    </div>
  )
}

export default Countdown
