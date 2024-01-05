import { cn } from '@/lib/utils';
import '@/styles/globals.css'
import { Inter } from "next/font/google"

export const metadata = {
  title: 'Breadit',
  description: 'A Reddit clone built with Next.js and TypeScript.',
}

const inter = Inter({subsets: ['latin']});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='es' className={cn('bg-white text-slate-900 antialiased ligth', inter.className)}>
      <body>{children}</body>
    </html>
  )
}
