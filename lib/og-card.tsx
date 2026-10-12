import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

/** The share card shown when a link is pasted into LinkedIn, WhatsApp, Slack
 *  or X. One design for every page; each page passes its own words, so a
 *  shared lesson shows that lesson rather than a generic site banner. */
export const OG_SIZE = { width: 1200, height: 630 }

export function ogCard({
  kicker,
  title,
  subtitle,
  footer,
}: {
  /** small label above the title, e.g. "GO (GOLANG) · CONCURRENCY" */
  kicker: string
  title: string
  subtitle?: string
  /** up to three short facts along the bottom */
  footer?: string[]
}) {
  // long titles drop a size so they stay on two or three lines
  const size = title.length > 60 ? 54 : title.length > 36 ? 64 : 72
  const sub = subtitle && subtitle.length > 150 ? subtitle.slice(0, subtitle.lastIndexOf(' ', 147)) + '…' : subtitle
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f0f10',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: '#f97316' }} />
          <div style={{ fontSize: 26, color: '#a1a1aa', letterSpacing: 1 }}>
            {`${SITE_NAME.toUpperCase()} · ${kicker.toUpperCase()}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: size, lineHeight: 1.1, color: '#fafafa', fontWeight: 700 }}>{title}</div>
          {sub ? <div style={{ marginTop: 28, fontSize: 30, color: '#a1a1aa', lineHeight: 1.35 }}>{sub}</div> : null}
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 25, color: '#71717a' }}>
          {(footer ?? ['devskills.in']).map((f) => (
            <div key={f}>{f}</div>
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
