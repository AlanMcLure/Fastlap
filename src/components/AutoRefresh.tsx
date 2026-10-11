'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Re-renders the page from the server every `seconds` while the tab is visible (live race threads),
 * so new comments and results show up without a reload. Nothing runs in a hidden tab.
 */
const AutoRefresh = ({ seconds }: { seconds: number }) => {
  const router = useRouter()
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, seconds * 1000)
    return () => clearInterval(timer)
  }, [router, seconds])
  return null
}

export default AutoRefresh
