import type { MetadataRoute } from 'next'
import { trackList } from '@/content/tracks'
import { SITE_NAME } from '@/lib/seo'

/** Generated rather than a static file so the description follows the track registry. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: learn ${trackList()}`,
    short_name: SITE_NAME,
    description: `Free step-by-step courses in plain English: ${trackList()}. Write your own answer first, then compare.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0f0f10',
    theme_color: '#0f0f10',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
