'use client'

import { useState } from 'react'

/** True when the failure is the Playground's, not the learner's code: a
 *  timeout, a busy server, or no connection. Only then is the fallback offered. */
export function playgroundTrouble(message: string): boolean {
  return /timeout running go build|took too long|could not reach|playground unavailable|too many runs|check your connection/i.test(message)
}

/**
 * The fallback when our Run proxy cannot get through: hand the exact code to
 * go.dev/play in a new tab. Tries a share link first (the code arrives
 * pre-filled); if even that fails, copies the code and opens a blank
 * playground so nothing typed is lost.
 */
export function OpenInPlayground({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'copied'>('idle')

  async function open() {
    setState('busy')
    // open the tab synchronously so pop-up blockers allow it, then point it
    const tab = window.open('about:blank', '_blank')
    try {
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, action: 'share' }),
      })
      const data = await res.json()
      if (data.url && tab) {
        tab.location.href = data.url
        setState('idle')
        return
      }
      throw new Error('no share url')
    } catch {
      await navigator.clipboard?.writeText(code).catch(() => {})
      if (tab) tab.location.href = 'https://go.dev/play/'
      setState('copied')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3.5 py-2 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
      <span>The Go Playground is busy right now.</span>
      <button
        type="button"
        onClick={open}
        disabled={state === 'busy'}
        className="rounded px-2 py-0.5 font-semibold transition hover:opacity-80"
        style={{ background: 'var(--surface-2)', color: 'var(--accent)' }}
      >
        {state === 'busy' ? 'Opening…' : 'Open in go.dev/play ↗'}
      </button>
      {state === 'copied' ? <span>Code copied: paste it into the playground.</span> : null}
    </div>
  )
}
