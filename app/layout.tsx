import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/common/Providers'
import { Footer, Shell } from '@/components/common/Nav'
import { SITE_URL, TITLE_TEMPLATE } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'System design interview preparation — answer first, then compare',
    template: TITLE_TEMPLATE,
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Dev Learning',
    locale: 'en_GB',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.webmanifest',
  // set NEXT_PUBLIC_GOOGLE_VERIFICATION / _BING_VERIFICATION in Vercel to verify
  // ownership; unset, no tag is emitted at all
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION }
      : {},
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  description:
    'Learn the method for answering system design interviews: requirements, lifecycle, numbers, design, tradeoffs. Write your own answer first, then compare. 44 topics and 16 worked problems, in dependency order.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
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
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
