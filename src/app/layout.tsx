import Navbar from '@/components/Navbar'
import { cn } from '@/lib/utils'
import { Inter, Poppins, Gabarito } from 'next/font/google'
import Providers from '@/components/Providers'
import { Toaster } from '@/components/ui/Toaster'

import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

const poppins = Poppins({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'FastLap',
  description: 'La red social para los aficionados de la Fórmula 1',
}

export default function RootLayout({
  children,
  authModal,
}: {
  children: React.ReactNode
  authModal: React.ReactNode
}) {
  return (
    <html
      lang='en'
      className={cn(
        'bg-white text-slate-900 antialiased light'
      )}>
      <body className={cn(
        'min-h-screen pt-12 bg-slate-50 antialiased',
        poppins.className
      )}>
       
        <Providers>
          {/* @ts-expect-error Server Component */}
          <Navbar />
          {authModal}

          <div className='container max-w-7xl mx-auto h-full pt-12'>
            {children}
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
