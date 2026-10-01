'use client'

import { useEffect } from 'react'

/** Registers /sw.js in production (the offline page and the cache of build files). Failures are harmless. */
const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // no service worker: the site works the same, just without the offline page
      })
    }
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}

export default ServiceWorkerRegister
