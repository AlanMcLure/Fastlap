import { ImageResponse } from 'next/og'

import { fit, type CardRow, type CardStat } from '@/lib/shareCards'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const DOTS = [1, 1, 1, 1, 1, 0.25, 1, 0.25, 0.25]

interface CardOptions {
  kicker: string
  title: string
  footer?: string
  /** Up to four lines under the title (podium, top of a table). */
  rows?: CardRow[]
  /** Up to four numbers in tiles under the title (profile). */
  stats?: CardStat[]
  /** Shown when there is nothing else to say under the title. */
  note?: string
}

/**
 * 1200×630 share card in the app's look: black, white text, dot-matrix mark. Plain fonts: no network at
 * render time. Used as Open Graph image and as the downloadable "share image" of a result.
 */
export function ogImage({ kicker, title, footer, rows = [], stats = [], note }: CardOptions) {
  const dense = rows.length > 0 || stats.length > 0
  const size = dense ? (title.length > 50 ? 44 : 56) : title.length > 90 ? 52 : title.length > 50 ? 64 : 80

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: '#000', color: '#fff', padding: dense ? 52 : 64,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: 84, gap: 12 }}>
            {DOTS.map((opacity, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', opacity }} />
            ))}
          </div>
          <div style={{ fontSize: 26, letterSpacing: 6, color: '#999' }}>{fit(kicker, 48).toUpperCase()}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? 14 : 24 }}>
          <div style={{ fontSize: size, lineHeight: 1.15, fontWeight: 700, display: 'flex' }}>{fit(title, 90)}</div>

          {rows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #333' }}>
              {rows.slice(0, 4).map((row, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '9px 0', borderBottom: '1px solid #222', fontSize: 32 }}>
                  {row.rank !== '' && <div style={{ width: 64, color: '#999', fontSize: 26, display: 'flex' }}>{row.rank}</div>}
                  <div style={{ flex: 1, display: 'flex', fontWeight: 700 }}>{fit(row.label, 30)}</div>
                  {row.detail && <div style={{ color: '#999', fontSize: 28, display: 'flex' }}>{fit(row.detail, 26)}</div>}
                </div>
              ))}
            </div>
          )}

          {stats.length > 0 && (
            <div style={{ display: 'flex', gap: 20 }}>
              {stats.slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 18, border: '1px solid #333', borderRadius: 20 }}>
                  <div style={{ fontSize: 22, letterSpacing: 3, color: '#999', display: 'flex' }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: 56, fontWeight: 700, display: 'flex' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {!dense && note && <div style={{ fontSize: 30, color: '#999', display: 'flex' }}>{fit(note, 100)}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#999' }}>
          <div>FastLap</div>
          <div>{footer ?? 'La red social de la Fórmula 1'}</div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
