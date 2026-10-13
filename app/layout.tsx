import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/common/Providers'
import { Footer, Shell } from '@/components/common/Nav'
import { SITE_JSONLD, SITE_NAME, SITE_URL, TITLE_TEMPLATE } from '@/lib/seo'
import { trackList } from '@/content/tracks'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Learn ${trackList()} step by step`,
    template: TITLE_TEMPLATE,
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  // set NEXT_PUBLIC_GOOGLE_VERIFICATION / _BING_VERIFICATION in Vercel to verify
  // ownership; unset, no tag is emitted at all
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION }
      : {},
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  description: `Free step-by-step courses in plain English: ${trackList()}. Lessons, practice problems and progress tracking. Write your own answer first, then compare.`,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f10' },
  ],
}

/** Applies the saved theme before first paint so there is no flash. */
const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('sdgym.v1')||'{}');if(s.theme==='dark'||s.theme==='light'){document.documentElement.setAttribute('data-theme',s.theme)}}catch(e){}`

/** GA4 measurement id (G-XXXXXXX). Unset, no Google tag is loaded at all. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/** Consent Mode v2 defaults: storage denied in the EEA, UK and Switzerland
 *  (GA then sends cookieless pings only), granted elsewhere. A consent banner
 *  that calls gtag('consent','update',…) is still needed before ads. */
const CONSENT_REGIONS = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH']

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSONLD) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Shell>{children}</Shell>
          <Footer />
        </Providers>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',region:${JSON.stringify(CONSENT_REGIONS)}});gtag('consent','default',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
