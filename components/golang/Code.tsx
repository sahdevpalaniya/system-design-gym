'use client'

import { useState, type ReactNode } from 'react'

/*
 * ponytail: a ~30-line regex highlighter instead of a syntax-highlighting
 * dependency. It handles Go's comments, strings, keywords, types and numbers,
 * which is everything our own snippets use. If we ever render user-supplied or
 * multi-language code, swap in shiki/prism.
 */

const KEYWORDS =
  /^(func|package|import|return|if|else|for|range|switch|case|default|break|continue|go|defer|select|chan|map|struct|interface|type|var|const|nil|true|false|make|new|len|cap|append|copy|delete|panic|recover|fallthrough|goto)$/

const TYPES =
  /^(string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|byte|rune|float32|float64|bool|error|any|complex64|complex128|uintptr)$/

/** Splits a line into coloured spans. Comments and strings win over words. */
function tokens(line: string): ReactNode[] {
  const out: ReactNode[] = []
  // comment, raw string, string, char, word, number, everything else
  const re = /(\/\/.*$)|(`[^`]*`)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|([A-Za-z_]\w*)|(\d+(?:\.\d+)?)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const [t] = m
    let color: string | undefined
    if (m[1]) color = 'var(--code-comment)'
    else if (m[2] || m[3] || m[4]) color = 'var(--code-string)'
    else if (m[5]) color = KEYWORDS.test(t) ? 'var(--code-key)' : TYPES.test(t) ? 'var(--code-type)' : undefined
    else if (m[6]) color = 'var(--code-num)'

    out.push(color ? <span key={m.index} style={{ color }}>{t}</span> : t)
    last = m.index + t.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

export function CodeBlock({
  label,
  src,
  note,
  run,
  canRun,
}: {
  label?: string
  src: string
  note?: string
  /** a complete program to run when the shown snippet is only an excerpt */
  run?: string
  /** set by the verification script on snippets proven to compile and run */
  canRun?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const lines = src.replace(/\n+$/, '').split('\n')

  // Never offer Run on something that has not been verified.
  const program = run ?? src
  const runnable = Boolean(run) || canRun === true

  async function runIt() {
    setBusy(true)
    setOutput(null)
    setFailed(false)
    try {
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: program }),
      })
      const data = await res.json()

      if (data.errors) {
        setFailed(true)
        setOutput(data.errors)
      } else if (data.error) {
        setFailed(true)
        setOutput(data.error)
      } else {
        setFailed(Boolean(data.stderr))
        setOutput(data.output || '(the program printed nothing)')
      }
    } catch {
      setFailed(true)
      setOutput('Could not reach the playground. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-strong)' }}>
        <div
          className="flex items-center gap-2 border-b px-3.5 py-2 text-[11.5px] font-semibold"
          style={{ background: 'var(--surface-2)', color: 'var(--faint)' }}
        >
          <span className="min-w-0 flex-1 truncate">{label ?? 'Go'}</span>
          {runnable ? (
            <button
              type="button"
              onClick={runIt}
              disabled={busy}
              className="shrink-0 rounded px-2 py-0.5 font-bold transition hover:opacity-80"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              title="Run this on the Go Playground"
            >
              {busy ? 'Running…' : '▶ Run'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(src).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1200)
              })
            }}
            className="shrink-0 rounded px-1.5 py-0.5 transition hover:opacity-70"
            style={{ color: copied ? 'var(--ok)' : 'var(--muted)' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre
          className="overflow-x-auto px-3.5 py-3 text-[13px] leading-[1.65]"
          style={{ background: 'var(--code-bg)', fontFamily: 'var(--font-mono)' }}
        >
          <code>
            {lines.map((l, i) => (
              <div key={i} className="flex">
                <span
                  className="tabular mr-3.5 shrink-0 select-none text-right"
                  style={{ color: 'var(--code-gutter)', minWidth: '1.6em' }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 whitespace-pre">{tokens(l)}</span>
              </div>
            ))}
          </code>
        </pre>

        {output !== null ? (
          <div className="border-t" style={{ borderColor: 'var(--border-strong)' }}>
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide uppercase"
              style={{ background: 'var(--surface-2)', color: failed ? 'var(--bad)' : 'var(--ok)' }}
            >
              {failed ? 'Error' : 'Output'}
              <button
                type="button"
                onClick={() => setOutput(null)}
                className="ml-auto font-normal tracking-normal normal-case transition hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Hide
              </button>
            </div>
            <pre
              className="overflow-x-auto px-3.5 py-2.5 text-[13px] leading-[1.6]"
              style={{
                background: 'var(--code-bg)',
                fontFamily: 'var(--font-mono)',
                color: failed ? 'var(--bad)' : 'var(--text)',
              }}
            >
              {output}
            </pre>
          </div>
        ) : null}
      </div>
      {note ? (
        <figcaption className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {note}
        </figcaption>
      ) : null}
    </figure>
  )
}
