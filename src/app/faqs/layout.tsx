import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Preguntas frecuentes sobre FastLap, la red social para los aficionados de la Fórmula 1.',
  alternates: { canonical: '/faqs' },
}

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children
}
