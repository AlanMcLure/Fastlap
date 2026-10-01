import { ReactNode } from 'react'

/**
 * Wrapper for a table that scrolls sideways on narrow screens. A scrollable area must be reachable
 * with the keyboard (WCAG 2.1.1), so it is focusable and named; arrow keys then scroll it.
 */
const ScrollRegion = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    role='region'
    tabIndex={0}
    aria-label={label}
    className='overflow-x-auto rounded-2xl border border-input bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
    {children}
  </div>
)

export default ScrollRegion
