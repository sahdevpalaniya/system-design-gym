'use client'

import { usePathname } from 'next/navigation'
import { isNoindexPath } from '@/lib/noindex'

/**
 * Screens with no publisher content of their own: the 404, the admin and
 * progress screens, the practice tools (which render "Loading…" until the
 * browser has your saved answers) and the curriculum map. The ad tag is not
 * loaded on them at all. Every noindexed page (lib/noindex.ts: drills,
 * practice modes and workspaces, quizzes, revision roll-ups, Go section hubs)
 * is excluded too, and so is /contact, which is a form and an address.
 */
const NO_ADS = [/^\/_not-found(\/|$)/, /^\/admin(\/|$)/, /^\/progress(\/|$)/, /^\/map(\/|$)/, /^\/contact\/?$/]

export function adsAllowed(pathname: string | null): boolean {
  return !!pathname && !NO_ADS.some((r) => r.test(pathname)) && !isNoindexPath(pathname)
}

/** A plain tag, not next/script: it must be in the server HTML for AdSense's
 *  code check. itemProp stops React 19 hoisting this async script above the
 *  consent defaults (it renders an async src script in place only when
 *  itemProp is set). Client components still render into the static HTML, so
 *  the pathname check happens at build time for prerendered pages.
 *
 *  In the browser it keeps whatever the server sent: the static 404 is served
 *  at any URL, so the browser's pathname need not match the server's, and a
 *  script React adds after load would not run anyway. */
export function AdSenseScript() {
  const pathname = usePathname()
  const show =
    typeof document === 'undefined'
      ? adsAllowed(pathname)
      : !!document.querySelector('script[itemprop="adsbygoogle"]')
  if (!show) return null
  return (
    <script
      itemProp="adsbygoogle"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6252978753553349"
      crossOrigin="anonymous"
    />
  )
}
