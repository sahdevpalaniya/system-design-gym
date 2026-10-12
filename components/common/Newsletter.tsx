'use client'

import { useState } from 'react'

/** Buttondown username. Unset, the form is not rendered at all, so the site
 *  never shows a signup that goes nowhere. */
const BUTTONDOWN = process.env.NEXT_PUBLIC_BUTTONDOWN_USER

/**
 * The one channel the site fully owns. Posts straight to Buttondown's public
 * embed endpoint (no API key in the browser); Buttondown sends the
 * double-opt-in confirmation, which also keeps the list clean.
 */
export function Newsletter({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  if (!BUTTONDOWN) return null

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    try {
      const res = await fetch(`https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN}`, {
        method: 'POST',
        body: new URLSearchParams({ email, tag: 'site' }),
        mode: 'no-cors',
      })
      // no-cors gives an opaque response; reaching here means it was sent
      void res
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <section
      aria-labelledby="newsletter"
      className={`rounded-xl border ${compact ? 'my-6 px-4 py-3.5' : 'my-10 px-5 py-5'}`}
      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
    >
      <div id="newsletter" className="text-[0.9688rem] font-semibold">
        One practice problem a week, by email
      </div>
      <p className="mt-1 text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
        A short drill and what a strong answer covers. New tracks and lessons when they ship. Unsubscribe in one click.
      </p>
      {state === 'done' ? (
        <p className="mt-3 text-[0.875rem] font-semibold" style={{ color: 'var(--ok)' }} role="status">
          Almost done: check your inbox and confirm.
        </p>
      ) : (
        <form onSubmit={subscribe} className="mt-3 flex flex-wrap gap-2">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-[0.9062rem]"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button
            type="submit"
            disabled={state === 'busy'}
            className="rounded-lg px-4 py-2 text-[0.875rem] font-semibold transition hover:opacity-85"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {state === 'busy' ? 'Sending…' : 'Subscribe'}
          </button>
          {state === 'error' ? (
            <span className="w-full text-[0.8125rem]" style={{ color: 'var(--bad)' }} role="alert">
              That did not go through. Check your connection and try again.
            </span>
          ) : null}
        </form>
      )}
    </section>
  )
}
