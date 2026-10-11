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

/** Current time in whole seconds, ticking every second; null on the server and the first client render. */
export const useNowSeconds = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
