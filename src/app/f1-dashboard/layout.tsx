import type { Metadata } from 'next'
import DashboardNav from '@/components/f1-dashboard/DashboardNav'
import { statsEnabled } from '@/lib/f1stats/client'

// Behind the sign-in (and Premium when enabled): nothing here is for crawlers.
export const metadata: Metadata = { robots: { index: false, follow: false } }

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className='pb-16'>
    <DashboardNav stats={statsEnabled()} />
    <div className='mt-8 min-w-0'>{children}</div>
  </div>
)

export default Layout
