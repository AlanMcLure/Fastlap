import DashboardNav from '@/components/f1-dashboard/DashboardNav'

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className='pb-16'>
    <DashboardNav />
    <main className='mt-8 min-w-0'>{children}</main>
  </div>
)

export default Layout
