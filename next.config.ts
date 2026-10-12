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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
