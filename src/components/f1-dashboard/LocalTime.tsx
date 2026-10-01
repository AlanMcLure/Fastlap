'use client'

import { useSyncExternalStore } from 'react'

import { formatSessionTime } from '@/lib/f1/format'

const subscribe = () => () => {}

interface LocalTimeProps {
  iso: string
  /** When false only the day is meaningful (the API gave no time). */
  timeKnown?: boolean
}

/** A session start in the viewer's time zone. The server renders it in UTC and the browser replaces it. */
const LocalTime = ({ iso, timeKnown = true }: LocalTimeProps) => {
  const start = new Date(iso)
  const text = useSyncExternalStore(
    subscribe,
    () => formatSessionTime(start),
    () => `${formatSessionTime(start, 'UTC')} UTC`
  )

  if (!timeKnown) return <span>{text.split(',')[0]}</span>
  return <time dateTime={iso}>{text}</time>
}

export default LocalTime
