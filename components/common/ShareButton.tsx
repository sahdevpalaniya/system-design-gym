'use client'

import { useState } from 'react'

/** Share this page: the phone's share sheet where there is one, otherwise
 *  copy the link. Each page has its own share card image, so a shared lesson
 *  shows that lesson. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href.split('#')[0]
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // the user closed the sheet; fall through to copying is not wanted
        return
      }
    }
    await navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button type="button" onClick={share} className="font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}
