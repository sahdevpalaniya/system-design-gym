import type { NextConfig } from 'next'

/**
 * Baseline security headers on every response. No Content-Security-Policy
 * yet: the theme script, JSON-LD and Google Analytics are inline, so a CSP
 * needs nonces first. frame-ancestors / X-Frame-Options stop other sites from
 * framing the pages (clickjacking).
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

/**
 * Old production addresses that still serve the site. Each page carries a
 * canonical to www.devskills.in, but Google still spends crawl time fetching
 * every copy, so send them to the real domain instead. Only these exact hosts:
 * preview deployments also live on *.vercel.app and must keep working.
 */
const OLD_HOSTS = ['devlearning-app.vercel.app', 'system-design-gym-gamma.vercel.app']

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: 'https://www.devskills.in/:path*',
      permanent: true,
    }))
  },
}

export default nextConfig
