import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'FastLap, la red social para los aficionados de la Fórmula 1'

export default function Image() {
  return ogImage({ kicker: 'Fórmula 1', title: 'La red social para los aficionados de la Fórmula 1', footer: 'Comunidades · pronósticos · datos' })
}
