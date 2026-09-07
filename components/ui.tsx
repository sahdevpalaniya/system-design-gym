'use client'

import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { AXES, AXIS_LABEL, type Axis, type NodeState, type Scores } from '@/lib/types'

/* ---------- inline markdown-lite ---------- */

/** Renders **bold**, `code` and _italic_ inside a plain string. Nothing else — content is ours. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>
        if (p.startsWith('_') && p.endsWith('_')) return <em key={i}>{p.slice(1, -1)}</em>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}

export function Prose({ paragraphs, className = '' }: { paragraphs: string[]; className?: string }) {
  return (
    <div className={`prose ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
    </div>
  )
}

export function Bullets({ items, marker }: { items: string[]; marker?: ReactNode }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
          <span className="mt-[0.45em] shrink-0" style={{ color: 'var(--border-strong)' }}>
            {marker ?? (
              <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden>
                <circle cx="3" cy="3" r="3" fill="currentColor" />
              </svg>
            )}
          </span>
          <span style={{ color: 'var(--text)' }}>
            <Rich text={it} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ---------- layout ---------- */

export function Page({ children }: { children: ReactNode; wide?: boolean }) {
  // full width — the sidebar is the only fixed column; content fills the rest
  return <main className="w-full px-5 pt-7 pb-20 sm:px-8">{children}</main>
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  meta,
}: {
  eyebrow?: ReactNode
  title: string
  lede?: string
  meta?: ReactNode
}) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[12px] font-semibold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
          {eyebrow}
        </div>
      ) : null}
      <h1 className="text-[28px] leading-[1.2] font-bold tracking-[-0.015em] sm:text-[34px]">
        {title}
      </h1>
      {lede ? (
        <p className="mt-3 text-[16.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          <Rich text={lede} />
        </p>
      ) : null}
      {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </header>
  )
}

export function Section({
  title,
  n,
  children,
  sub,
}: {
  title: string
  n?: string
  sub?: string
  children: ReactNode
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline gap-2.5">
        {n ? (
          <span
            className="tabular text-[12px] font-bold"
            style={{ color: 'var(--accent)' }}
          >
            {n}
          </span>
        ) : null}
        <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
      </div>
      {sub ? (
        <p className="mb-3 text-[14px]" style={{ color: 'var(--muted)' }}>
          {sub}
        </p>
      ) : null}
      {children}
    </section>
  )
}

/* ---------- atoms ---------- */

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'bad'
}) {
  const colors: Record<string, { c: string; b: string }> = {
    neutral: { c: 'var(--muted)', b: 'var(--surface-2)' },
    accent: { c: 'var(--accent)', b: 'var(--accent-soft)' },
    ok: { c: 'var(--ok)', b: 'var(--surface-2)' },
    warn: { c: 'var(--warn)', b: 'var(--surface-2)' },
    bad: { c: 'var(--bad)', b: 'var(--surface-2)' },
  }
  const s = colors[tone]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: s.c, background: s.b }}
    >
      {children}
    </span>
  )
}

export const STATE_INFO: Record<NodeState, { label: string; color: string }> = {
  untouched: { label: 'Not started', color: 'var(--dim)' },
  attempted: { label: 'Attempted', color: 'var(--warn)' },
  solid: { label: 'Solid', color: 'var(--ok)' },
  review: { label: 'Needs review', color: 'var(--bad)' },
}

export function StateDot({ state, size = 8 }: { state: NodeState; size?: number }) {
  return (
    <span
      aria-label={STATE_INFO[state].label}
      title={STATE_INFO[state].label}
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: state === 'untouched' ? 'transparent' : STATE_INFO[state].color,
        border: state === 'untouched' ? `1.5px solid ${STATE_INFO[state].color}` : 'none',
      }}
    />
  )
}

export function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  disabled,
  type = 'button',
  full,
  size = 'md',
}: {
  children: ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  type?: 'button' | 'submit'
  full?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-[13px]',
    md: 'px-4 py-2.5 text-[14.5px]',
    lg: 'px-5 py-3 text-[15.5px]',
  }
  const base = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${full ? 'w-full' : ''}`
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid transparent' },
    secondary: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid transparent' },
  }
  const cls = `${base} ${disabled ? '' : 'hover:opacity-88 active:scale-[0.985]'}`
  if (href && !disabled)
    return (
      <Link href={href} className={cls} style={styles[variant]}>
        {children}
      </Link>
    )
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={styles[variant]}>
      {children}
    </button>
  )
}

export function Card({
  children,
  href,
  className = '',
}: {
  children: ReactNode
  href?: string
  className?: string
}) {
  const cls = `card p-5 ${href ? 'transition hover:-translate-y-px' : ''} ${className}`
  if (href)
    return (
      <Link href={href} className={`block ${cls}`}>
        {children}
      </Link>
    )
  return <div className={cls}>{children}</div>
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <div className="tabular text-[26px] leading-none font-bold">{value}</div>
      <div className="mt-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-xl border border-dashed px-5 py-8 text-center text-[14px]"
      style={{ color: 'var(--faint)', borderColor: 'var(--border-strong)' }}
    >
      {children}
    </div>
  )
}

/* ---------- six-axis radar ---------- */

export function Radar({
  scores,
  compare,
  size = 260,
}: {
  scores: Scores
  compare?: Scores | null
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 46
  const n = AXES.length

  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const d = (Math.max(0, Math.min(10, value)) / 10) * r
    return [cx + Math.cos(angle) * d, cy + Math.sin(angle) * d] as const
  }

  const poly = (s: Scores) => AXES.map((a, i) => point(i, s[a]).join(',')).join(' ')
  const hasData = AXES.some((a) => scores[a] > 0)
  // the left/right axis labels sit outside the chart circle, so the viewBox needs
  // horizontal room they can spill into — without it, "Defence" renders as "efence"
  const hp = 54

  return (
    <svg
      width={size + hp * 2}
      height={size}
      viewBox={`${-hp} 0 ${size + hp * 2} ${size}`}
      style={{ maxWidth: '100%', height: 'auto' }}
      role="img"
      aria-label="Six-axis skill profile"
    >
      {[2.5, 5, 7.5, 10].map((ring) => (
        <polygon
          key={ring}
          points={AXES.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, 10)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />
      })}

      {compare ? (
        <polygon
          points={poly(compare)}
          fill="none"
          stroke="var(--faint)"
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
      ) : null}

      {hasData ? (
        <polygon
          points={poly(scores)}
          fill="var(--accent)"
          fillOpacity="0.16"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : null}

      {AXES.map((a, i) => {
        const [x, y] = point(i, hasData ? scores[a] : 0)
        return hasData ? <circle key={a} cx={x} cy={y} r="3" fill="var(--accent)" /> : null
      })}

      {AXES.map((a, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const lx = cx + Math.cos(angle) * (r + 26)
        const ly = cy + Math.sin(angle) * (r + 26)
        const anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
        return (
          <g key={a}>
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--font-ui)"
              fill="var(--muted)"
            >
              {AXIS_LABEL[a]}
            </text>
            <text
              x={lx}
              y={ly + 12}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10.5"
              fontFamily="var(--font-ui)"
              fill={scores[a] > 0 ? 'var(--accent)' : 'var(--faint)'}
              className="tabular"
            >
              {scores[a] > 0 ? scores[a].toFixed(1) : '—'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function AxisBars({ scores }: { scores: Scores }) {
  return (
    <div className="space-y-2.5">
      {AXES.map((a) => {
        const v = scores[a]
        const tone = v === 0 ? 'var(--dim)' : v < 5 ? 'var(--bad)' : v < 7 ? 'var(--warn)' : 'var(--ok)'
        return (
          <div key={a}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[13px] font-medium">{AXIS_LABEL[a]}</span>
              <span className="tabular text-[13px]" style={{ color: 'var(--muted)' }}>
                {v > 0 ? `${v.toFixed(1)} / 10` : 'no data'}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
              <div className="h-full rounded-full" style={{ width: `${(v / 10) * 100}%`, background: tone }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function axisTone(v: number): 'ok' | 'warn' | 'bad' | 'neutral' {
  if (v === 0) return 'neutral'
  if (v < 5) return 'bad'
  if (v < 7) return 'warn'
  return 'ok'
}

export type { Axis }
