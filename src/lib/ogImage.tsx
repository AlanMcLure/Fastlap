import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const DOTS = [1, 1, 1, 1, 1, 0.25, 1, 0.25, 0.25]

/** 1200×630 share card in the app's look: black, white text, dot-matrix mark. Plain fonts: no network at render time. */
export function ogImage({ kicker, title, footer }: { kicker: string; title: string; footer?: string }) {
  const size = title.length > 90 ? 52 : title.length > 50 ? 64 : 80
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: '#000', color: '#fff', padding: 72,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: 84, gap: 12 }}>
            {DOTS.map((opacity, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', opacity }} />
            ))}
          </div>
          <div style={{ fontSize: 28, letterSpacing: 6, color: '#999' }}>{kicker.toUpperCase()}</div>
        </div>
        <div style={{ fontSize: size, lineHeight: 1.15, fontWeight: 700, display: 'flex' }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#999' }}>
          <div>FastLap</div>
          <div>{footer ?? 'La red social de la Fórmula 1'}</div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
