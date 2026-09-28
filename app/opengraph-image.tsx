import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'System design interview preparation — answer first, then compare'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** The card people see when a link is pasted into Slack, LinkedIn or WhatsApp. */
export default function OgImage() {
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
          <div style={{ fontSize: 26, color: '#a1a1aa', letterSpacing: 1 }}>DEV LEARNING</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 66, lineHeight: 1.1, color: '#fafafa', fontWeight: 700 }}>
            System design interviews,
          </div>
          <div style={{ fontSize: 66, lineHeight: 1.1, color: '#f97316', fontWeight: 700 }}>
            answer first, then compare.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: '#a1a1aa', lineHeight: 1.35 }}>
            The method, not a catalogue. Requirements, lifecycle, numbers,
            design, tradeoffs — on every problem.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 25, color: '#71717a' }}>
          <div>44 topics</div>
          <div>16 worked problems</div>
          <div>Every cost named</div>
        </div>
      </div>
    ),
    size,
  )
}
