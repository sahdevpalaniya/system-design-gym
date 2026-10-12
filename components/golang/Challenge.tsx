'use client'

import { useRef, useState } from 'react'
import type { LangChallenge } from '@/lib/types'
import { forbidden, mergeForTest, newNonce, verdict, visibleOutput, type TestVerdict } from '@/lib/challenge'
import { Rich } from '@/components/common/ui'
import { OpenInPlayground, playgroundTrouble } from './OpenInPlayground'

/**
 * An auto-graded exercise: edit the starter, run the hidden tests on the Go
 * Playground, see pass or the failing cases. The solution unlocks after the
 * first attempt, not before: trying first is the point of the whole site.
 */
export function Challenge({ c }: { c: LangChallenge }) {
  const [code, setCode] = useState(c.starter)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<(TestVerdict & { output: string }) | null>(null)
  const [tried, setTried] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  // Escape releases the editor: the next Tab moves focus on instead of
  // indenting, so keyboard users are never trapped (WCAG 2.1.2)
  const released = useRef(false)

  async function runTests() {
    const refused = forbidden(code)
    if (refused) {
      setResult({ passed: false, message: refused, output: '' })
      setTried(true)
      return
    }
    setBusy(true)
    setResult(null)
    const nonce = newNonce()
    try {
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mergeForTest(code, c.test, nonce) }),
      })
      const data = await res.json()
      const errors = data.error || data.errors || data.vet || ''
      const output = data.output ?? ''
      setResult({ ...verdict(output, errors, nonce), output: visibleOutput(output) })
    } catch {
      setResult({ passed: false, message: 'Could not reach the playground. Check your connection.', output: '' })
    } finally {
      setBusy(false)
      setTried(true)
    }
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-strong)' }}>
      <div className="px-4 pt-3.5 pb-2 text-[0.9375rem] leading-relaxed">
        <Rich text={c.prompt} />
      </div>

      <label className="sr-only" htmlFor="challenge-code">
        Your code
      </label>
      <textarea
        id="challenge-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            released.current = true
            return
          }
          if (e.key === 'Tab' && !e.shiftKey && !released.current) {
            e.preventDefault()
            // execCommand keeps the browser's undo history; setting the value
            // through state would wipe it, so Ctrl+Z would stop working
            if (!document.execCommand('insertText', false, '\t')) {
              const t = e.currentTarget
              t.setRangeText('\t', t.selectionStart, t.selectionEnd, 'end')
              setCode(t.value)
            }
          }
        }}
        onFocus={() => (released.current = false)}
        aria-describedby="challenge-help"
        spellCheck={false}
        rows={Math.min(22, Math.max(8, code.split('\n').length + 1))}
        className="block w-full resize-y border-y px-3.5 py-3 text-[0.8125rem] leading-[1.65] outline-none"
        style={{
          background: 'var(--code-bg)',
          borderColor: 'var(--border)',
          fontFamily: 'var(--font-mono)',
          tabSize: 4,
          color: 'var(--text)',
        }}
      />

      <p id="challenge-help" className="px-4 pt-2 text-[0.75rem]" style={{ color: 'var(--faint)' }}>
        Tab indents. Press Esc, then Tab, to leave the editor.
      </p>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={runTests}
          disabled={busy}
          aria-busy={busy}
          className="rounded-lg px-3 py-1.5 text-[0.8438rem] font-bold transition hover:opacity-85"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          {busy ? 'Running tests…' : '▶ Run tests'}
        </button>
        <button
          type="button"
          onClick={() => {
            setCode(c.starter)
            setResult(null)
          }}
          className="rounded-lg px-3 py-1.5 text-[0.8438rem] transition hover:opacity-70"
          style={{ color: 'var(--muted)' }}
        >
          Reset
        </button>
        {tried ? (
          <button
            type="button"
            onClick={() => setShowSolution(!showSolution)}
            className="ml-auto rounded-lg px-3 py-1.5 text-[0.8438rem] transition hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            {showSolution ? 'Hide solution' : 'Show a solution'}
          </button>
        ) : null}
      </div>

      {/* only the one-line status is announced; the output is there to read */}
      <div className="sr-only" aria-live="polite">
        {busy ? 'Running tests' : result ? (result.passed ? 'All tests pass.' : 'Not yet. Some tests failed.') : ''}
      </div>
      {result ? (
        <div className="border-t px-4 py-3 text-[0.875rem]" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-1.5 font-bold" style={{ color: result.passed ? 'var(--ok)' : 'var(--bad)' }}>
            {result.passed ? 'All tests pass.' : 'Not yet.'}
          </div>
          {result.message || result.output ? (
            <pre
              className="overflow-x-auto text-[0.8125rem] leading-[1.6] whitespace-pre-wrap"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
            >
              {result.message || result.output}
            </pre>
          ) : null}
          {!result.passed && result.message && playgroundTrouble(result.message) ? (
            <OpenInPlayground code={mergeForTest(code, c.test, newNonce())} />
          ) : null}
        </div>
      ) : null}

      {showSolution ? (
        <pre
          className="overflow-x-auto border-t px-3.5 py-3 text-[0.8125rem] leading-[1.65]"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontFamily: 'var(--font-mono)' }}
        >
          {c.solution}
        </pre>
      ) : null}
    </div>
  )
}
